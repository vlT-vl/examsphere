// jsonparse.js <> jsex
//******************************************************************************
// v2 version - permette il decypt di file json crittografati con ecnrypt.js
//******************************************************************************
// Modulo js per il load di file json da path esterni, anche HTTP
// la funzione per caricare une file JSON in una variabile è:
//         > es. jsonparse(filePath, password)
//                  .then((jsonData) => {VARIABILE = jsonData})
//                  .catch((e) => {  cach errore });
//
//******************************************************************************

// ✅ Verifica se il codice è in esecuzione in un browser o in Node.js
const isNode = typeof window === "undefined";

let fs, path;
if (isNode) {
    fs = await import("fs/promises");
    path = await import("path");
    const { fileURLToPath } = await import("url");
    global.__filename = fileURLToPath(import.meta.url);
    global.__dirname = path.dirname(__filename);
}

async function deriveKey(password, salt) {
    const encoder = new TextEncoder();

    // ✅ Importiamo la password come chiave raw
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password), // **Forziamo l'encoding della password**
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    // ✅ Normalizziamo il formato del salt in Uint8Array
    const saltBuffer = encoder.encode(salt);

    // ✅ Deriviamo direttamente la chiave invece di usare deriveBits()
    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: saltBuffer,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-CBC", length: 256 },
        true,
        ["decrypt"]
    );

    // ✅ Esportiamo la chiave per verificarla
    const rawKey = await crypto.subtle.exportKey("raw", key);
    // console.log("🔑 Chiave derivata nel browser (HEX):",
    //     [...new Uint8Array(rawKey)].map(b => b.toString(16).padStart(2, "0")).join(""));
    // console.log("🔑 Chiave derivata nel browser (RAW Uint8Array):", [...new Uint8Array(rawKey)]);

    return key;
}

// ✅ Funzione per convertire Base64 in Uint8Array
function base64ToUint8Array(base64) {
    try {
        const raw = atob(base64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            bytes[i] = raw.charCodeAt(i);
        }
        return bytes;
    } catch (error) {
        //console.error("❌ Errore nella conversione Base64 → Uint8Array:", error);
        return new Uint8Array([]); // Restituisci array vuoto in caso di errore
    }
}

async function decryptJSON(encryptedJSON, password) {
    try {
        //console.log("🔍 JSON ricevuto prima della decrittografia:", encryptedJSON);

        // ✅ Deriviamo la chiave dalla password
        const key = await deriveKey(password, "static_salt");

        const iv = base64ToUint8Array(encryptedJSON.iv);
        const encryptedData = base64ToUint8Array(encryptedJSON.data);

        // console.log("🛠 IV (Uint8Array - Browser):", iv);
        // console.log("🛠 Dati crittografati (Uint8Array - Browser):", encryptedData);

        const decryptedData = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv: iv },
            key,
            encryptedData
        );

        //console.log("✅ Decrittografia riuscita!");
        return JSON.parse(new TextDecoder().decode(decryptedData));
    } catch (error) {
        console.error("❌ Errore nella decrittografia AES:", error);
        throw new Error("❌ Impossibile decrittare il file JSON. Controlla la password e il formato del file.");
    }
}



export default async function jsonparse(filePath, password) {
    try {
        let jsonData;

        if (isNode) {
            const absolutePath = path.join(__dirname, filePath);
            const jsonDataRaw = await fs.readFile(absolutePath, "utf8");
            jsonData = JSON.parse(jsonDataRaw);
        } else {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`❌ Errore nel caricamento del file JSON remoto: ${filePath}`);
            }
            jsonData = await response.json();
        }

        if (jsonData.iv && jsonData.data) {
            jsonData = await decryptJSON(jsonData, password);
        }

        return jsonData;
    } catch (error) {
        console.error("❌ Errore nel caricamento/decrittografia del JSON:", error);
        throw new Error("❌ Impossibile caricare o decrittare il file JSON. Verifica la password e il formato.");
    }
}
