/**
 * Shrinks phone photos before upload so adding a batch stays instant on 4G.
 */
export async function compressImage(
    file: File,
    maxSize = 1600,
    quality = 0.85,
): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
        return file;
    }

    try {
        const bitmap = await createImageBitmap(file, {
            imageOrientation: 'from-image',
        });

        const scale = Math.min(
            1,
            maxSize / Math.max(bitmap.width, bitmap.height),
        );

        if (scale === 1 && file.size < 1_500_000) {
            bitmap.close();

            return file;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);

        canvas
            .getContext('2d')
            ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', quality),
        );

        if (!blob) {
            return file;
        }

        return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });
    } catch {
        return file;
    }
}
