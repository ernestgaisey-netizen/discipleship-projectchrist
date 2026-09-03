<?php

namespace App\Console\Commands;

use App\Models\MentorshipSession;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendSessionReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-session-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Notify mentor and student ~1 hour before a scheduled mentorship session. '
        . 'Meant to run every few minutes; reminder_sent_at guards against sending the same reminder twice.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $windowStart = now();
        $windowEnd   = now()->addHour();

        $sessions = MentorshipSession::with(['mentor:id,name', 'student:id,name'])
            ->where('status', 'scheduled')
            ->whereNull('reminder_sent_at')
            ->whereBetween('scheduled_at', [$windowStart, $windowEnd])
            ->get();

        foreach ($sessions as $session) {
            NotificationService::sessionReminder($session->student_id, $session->title, $session->mentor->name ?? 'your mentor', $session->scheduled_at);
            NotificationService::sessionReminder($session->mentor_id, $session->title, $session->student->name ?? 'your mentee', $session->scheduled_at);
            $session->update(['reminder_sent_at' => now()]);
            $this->line("Reminded for session #{$session->id} ({$session->title}) at {$session->scheduled_at}");
        }

        $this->info("Done. {$sessions->count()} reminder(s) sent.");
        return self::SUCCESS;
    }
}
