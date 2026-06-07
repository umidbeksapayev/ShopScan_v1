import { buildReceiptBytes } from "@/lib/escpos";
import type { ReceiptData } from "@/lib/receipt-print";

/**
 * Web Bluetooth (BLE) orqali termal printerga ESC/POS chek yuborish.
 * Flutter `print_bluetooth_thermal` (Bluetooth Classic SPP) ning web ekvivalenti.
 *
 * CHEKLOVLAR:
 *  - Faqat BLE (GATT) printerlar; Bluetooth Classic SPP printerlar brauzerda ishlamaydi.
 *  - Chrome/Edge/Android. iOS Safari va Firefox Web Bluetooth'ni qo'llamaydi.
 *  - HTTPS (yoki localhost) talab qilinadi; requestDevice foydalanuvchi gesture'ida.
 */

// --- Minimal Web Bluetooth tiplari (yangi paketsiz, TS uchun) ---
interface GattCharacteristic {
  uuid: string;
  properties?: { write?: boolean; writeWithoutResponse?: boolean };
  writeValue(value: Uint8Array): Promise<void>;
  writeValueWithoutResponse?(value: Uint8Array): Promise<void>;
}
interface GattService {
  uuid: string;
  getCharacteristics(): Promise<GattCharacteristic[]>;
}
interface GattServer {
  connected: boolean;
  connect(): Promise<GattServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<GattService[]>;
}
interface BleDevice {
  id: string;
  name?: string;
  gatt?: GattServer;
  addEventListener(type: string, listener: () => void): void;
}
interface BluetoothApi {
  requestDevice(options: {
    acceptAllDevices?: boolean;
    optionalServices?: (string | number)[];
  }): Promise<BleDevice>;
}
type NavigatorWithBluetooth = Navigator & { bluetooth?: BluetoothApi };

/** Keng tarqalgan BLE termal printer servis UUID'lari (har xil bo'lishi mumkin). */
const KNOWN_SERVICES: (string | number)[] = [
  0xffe0,
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 / seriya-BLE
  0x18f0,
  "000018f0-0000-1000-8000-00805f9b34fb", // ko'p ESC/POS BLE printerlar
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC/Microchip transparent
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART
];

let cachedDevice: BleDevice | null = null;
let cachedChar: GattCharacteristic | null = null;

export function isWebBluetoothSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!(navigator as NavigatorWithBluetooth).bluetooth
  );
}

function getBluetooth(): BluetoothApi {
  const bt = (navigator as NavigatorWithBluetooth).bluetooth;
  if (!bt) throw new Error("Web Bluetooth qo'llab-quvvatlanmaydi");
  return bt;
}

/** GATT serverdagi birinchi yoziladigan xususiyatni topadi. */
async function findWritableCharacteristic(
  server: GattServer
): Promise<GattCharacteristic | null> {
  const services = await server.getPrimaryServices();
  for (const svc of services) {
    let chars: GattCharacteristic[];
    try {
      chars = await svc.getCharacteristics();
    } catch {
      continue;
    }
    for (const ch of chars) {
      if (ch.properties?.write || ch.properties?.writeWithoutResponse) {
        return ch;
      }
    }
  }
  return null;
}

/**
 * Foydalanuvchidan printer tanlashni so'raydi va ulanadi.
 * Tugma bosish (user gesture) ichidan chaqirilishi shart.
 */
export async function connectPrinter(): Promise<string> {
  const device = await getBluetooth().requestDevice({
    acceptAllDevices: true,
    optionalServices: KNOWN_SERVICES,
  });
  if (!device.gatt) throw new Error("Qurilmada GATT yo'q");

  const server = await device.gatt.connect();
  const ch = await findWritableCharacteristic(server);
  if (!ch) {
    server.disconnect();
    throw new Error("Yoziladigan xususiyat (characteristic) topilmadi");
  }

  cachedDevice = device;
  cachedChar = ch;
  device.addEventListener("gattserverdisconnected", () => {
    cachedChar = null;
  });

  return device.name ?? "Printer";
}

/** Mavjud ulanishni qayta tiklaydi yoki yangi printer so'raydi. */
async function ensureConnected(): Promise<void> {
  if (cachedChar && cachedDevice?.gatt?.connected) return;

  if (cachedDevice?.gatt) {
    try {
      const server = await cachedDevice.gatt.connect();
      const ch = await findWritableCharacteristic(server);
      if (ch) {
        cachedChar = ch;
        return;
      }
    } catch {
      /* qayta ulanmadi — yangi qurilma so'raymiz */
    }
  }
  await connectPrinter();
}

/** Baytlarni BLE MTU cheklovini hisobga olib bo'laklab yuboradi. */
async function writeBytes(ch: GattCharacteristic, bytes: Uint8Array): Promise<void> {
  const CHUNK = 100;
  const useNoResponse =
    !!ch.properties?.writeWithoutResponse &&
    typeof ch.writeValueWithoutResponse === "function";

  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    if (useNoResponse) {
      await ch.writeValueWithoutResponse!(slice);
    } else {
      await ch.writeValue(slice);
    }
    // Arzon printerlar buferi to'lib ketmasligi uchun kichik kechikish.
    await new Promise((r) => setTimeout(r, 30));
  }
}

/**
 * Chekni BLE termal printerga chop etadi.
 * @param width 58mm ≈ 32, 80mm ≈ 48.
 */
export async function printViaBluetooth(
  data: ReceiptData,
  width = 32
): Promise<void> {
  await ensureConnected();
  if (!cachedChar) throw new Error("Printerga ulanib bo'lmadi");
  const bytes = buildReceiptBytes(data, width);
  await writeBytes(cachedChar, bytes);
}
