import os
import re

backend_path = r"d:\MyProject\KaidNews\OlympicOEOBakand"

def replace_in_file(path, old, new):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        
# 1. Update Meetings Migration
meetings_migration = os.path.join(backend_path, r"database\migrations\2026_09_16_141938_create_meetings_table.php")
meetings_up_old = """        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });"""
meetings_up_new = """        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->string('topic');
            $table->date('date');
            $table->time('time');
            $table->string('room')->nullable();
            $table->json('attendees')->nullable();
            $table->json('points')->nullable();
            $table->timestamps();
        });"""
replace_in_file(meetings_migration, meetings_up_old, meetings_up_new)

# 2. Update Decisions Migration
decisions_migration = os.path.join(backend_path, r"database\migrations\2026_09_16_141953_create_decisions_table.php")
decisions_up_old = """        Schema::create('decisions', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });"""
decisions_up_new = """        Schema::create('decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->nullable()->constrained()->nullOnDelete();
            $table->string('category')->nullable();
            $table->string('type')->default('normal');
            $table->json('checklist_items')->nullable();
            $table->text('text');
            $table->json('assignee_ids')->nullable();
            $table->date('deadline')->nullable();
            $table->integer('progress')->default(0);
            $table->timestamps();
        });"""
replace_in_file(decisions_migration, decisions_up_old, decisions_up_new)

print("Migrations patched successfully.")
