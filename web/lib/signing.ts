import { env } from "@/env/server";
import type { ReleaseFile, Platform } from "@/lib/types";
import { createPrivateKey, sign as cryptoSign } from "crypto";
import { readFileSync } from "fs";

export const SIGNATURE_ALGORITHM = "Ed25519";

export interface ReleaseSignaturePayload {
    releaseId: string;
    version: string;
    platform: Platform;
    fileName: string;
    fileSize: number;
    sha256: string;
}

export interface ReleaseSignature {
    signature: string;
    signatureAlgorithm: typeof SIGNATURE_ALGORITHM;
    signedAt: Date;
    signingKeyId: string | null;
}

export class SigningConfigurationError extends Error {
    constructor() {
        super(
            "Update signing is not configured. Set UPDATE_SIGNING_PRIVATE_KEY_PEM or UPDATE_SIGNING_PRIVATE_KEY_PATH.",
        );
        this.name = "SigningConfigurationError";
    }
}

function getPrivateKeyPem(): string {
    const inlineKey = env.UPDATE_SIGNING_PRIVATE_KEY_PEM;
    if (inlineKey) return inlineKey.replace(/\\n/g, "\n");

    const keyPath = env.UPDATE_SIGNING_PRIVATE_KEY_PATH;
    if (keyPath) return readFileSync(keyPath, "utf8");

    throw new SigningConfigurationError();
}

export function canonicalizeReleasePayload(
    payload: ReleaseSignaturePayload,
): string {
    return JSON.stringify({
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        platform: payload.platform,
        releaseId: payload.releaseId,
        sha256: payload.sha256,
        version: payload.version,
    });
}

export function signReleasePayload(
    payload: ReleaseSignaturePayload,
): ReleaseSignature {
    const privateKey = createPrivateKey(getPrivateKeyPem());
    const canonicalPayload = canonicalizeReleasePayload(payload);
    const signature = cryptoSign(
        null,
        Buffer.from(canonicalPayload, "utf8"),
        privateKey,
    ).toString("base64");

    return {
        signature,
        signatureAlgorithm: SIGNATURE_ALGORITHM,
        signedAt: new Date(),
        signingKeyId: env.UPDATE_SIGNING_KEY_ID ?? null,
    };
}

export function hasUsableSignatureMetadata(file: ReleaseFile): boolean {
    return Boolean(
        file.sha256 &&
            file.signature &&
            file.signatureAlgorithm === SIGNATURE_ALGORITHM &&
            file.signedAt,
    );
}
