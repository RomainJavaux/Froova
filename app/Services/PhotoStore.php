<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

/**
 * Stores item photos as lightweight, correctly oriented WebP files.
 */
class PhotoStore
{
    private const MAX_SIZE = 1400;

    public function store(UploadedFile $file, string $directory): string
    {
        $image = (new ImageManager(Driver::class))->decodePath((string) $file->getRealPath());

        $image->scaleDown(self::MAX_SIZE, self::MAX_SIZE);

        $path = trim($directory, '/').'/'.Str::uuid7().'.webp';

        Storage::disk('public')->put($path, $image->encode(new WebpEncoder(quality: 80, strip: true))->toString());

        return $path;
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
