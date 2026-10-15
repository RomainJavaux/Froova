<?php

namespace App\Enums;

enum MovementType: string
{
    case Added = 'added';
    case Taken = 'taken';
    case Restocked = 'restocked';
    case Moved = 'moved';
    case Updated = 'updated';
    case Discarded = 'discarded';
}
