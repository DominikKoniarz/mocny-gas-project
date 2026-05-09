import { generateKeyPairSync } from "crypto";

const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
    privateKeyEncoding: {
        format: "pem",
        type: "pkcs8",
    },
    publicKeyEncoding: {
        format: "pem",
        type: "spki",
    },
});

console.log("UPDATE_SIGNING_PRIVATE_KEY_PEM=");
console.log(privateKey);
console.log("UPDATE_SIGNING_PUBLIC_KEY_PEM=");
console.log(publicKey);
