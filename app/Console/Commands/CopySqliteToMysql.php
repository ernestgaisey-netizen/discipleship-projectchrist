<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CopySqliteToMysql extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:copy-sqlite-to-mysql {sqlite-path}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'One-off: copy all data from a SQLite database file into the current (MySQL) connection.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $sqlitePath = $this->argument('sqlite-path');

        if (!file_exists($sqlitePath)) {
            $this->error("File not found: {$sqlitePath}");
            return self::FAILURE;
        }

        config(['database.connections.sqlite_source' => [
            'driver'                  => 'sqlite',
            'database'                => $sqlitePath,
            'prefix'                  => '',
            'foreign_key_constraints' => false,
        ]]);

        $tables = DB::connection('sqlite_source')->select(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'"
        );

        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');

        foreach ($tables as $t) {
            $table = $t->name;
            $rows  = DB::connection('sqlite_source')->table($table)->get();

            if ($rows->isEmpty()) {
                $this->line("{$table}: 0 rows");
                continue;
            }

            DB::connection('mysql')->table($table)->truncate();

            foreach ($rows->chunk(200) as $chunk) {
                $data = $chunk->map(fn ($r) => (array) $r)->toArray();
                DB::connection('mysql')->table($table)->insert($data);
            }

            $this->line("{$table}: {$rows->count()} rows copied");
        }

        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');

        $this->info('Done.');
        return self::SUCCESS;
    }
}
