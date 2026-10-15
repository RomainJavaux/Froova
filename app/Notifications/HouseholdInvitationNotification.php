<?php

namespace App\Notifications;

use App\Models\HouseholdInvitation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HouseholdInvitationNotification extends Notification
{
    public function __construct(public HouseholdInvitation $invitation) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $household = $this->invitation->household;
        $inviter = $this->invitation->inviter->name ?? 'Quelqu’un';

        return (new MailMessage)
            ->subject("{$inviter} t’invite dans {$household->name} sur ".config('app.name'))
            ->greeting('Coucou ! 👋')
            ->line("{$inviter} t’invite à partager les congélateurs de **{$household->emoji} {$household->name}**.")
            ->line('Tu pourras voir ce qu’il reste, ajouter tes batchs et savoir en un coup d’œil dans quel tiroir se cache la dernière part de lasagnes.')
            ->action('Rejoindre '.$household->name, $this->invitation->url())
            ->line('Cette invitation est valable 7 jours.')
            ->salutation('À très vite sur '.config('app.name').' ❄️');
    }
}
