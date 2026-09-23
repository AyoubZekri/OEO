import os
import glob
import re

backend_path = r'D:\MyProject\KaidNews\OlympicOEOBakand'

# 1. Update Model
model_path = os.path.join(backend_path, 'app', 'Models', 'PlayerMedicalRecord.php')
with open(model_path, 'r', encoding='utf-8') as f:
    model_content = f.read()

if 'absence_from' not in model_content:
    model_content = model_content.replace("'medical_decision',", "'medical_decision',\n        'absence_from',\n        'absence_to',")
    with open(model_path, 'w', encoding='utf-8') as f:
        f.write(model_content)
    print("Model updated.")

# 2. Update Controller
controller_path = os.path.join(backend_path, 'app', 'Http', 'Controllers', 'Api', 'PlayerMedicalRecordController.php')
with open(controller_path, 'r', encoding='utf-8') as f:
    controller_content = f.read()

if 'absence_from' not in controller_content:
    # Update rules
    rules_addition = "            'absence_from' => 'nullable|date',\n            'absence_to' => 'nullable|date|after_or_equal:absence_from',"
    controller_content = controller_content.replace("'medical_decision' => 'nullable|string',", "'medical_decision' => 'nullable|string',\n" + rules_addition)
    
    with open(controller_path, 'w', encoding='utf-8') as f:
        f.write(controller_content)
    print("Controller updated.")

# 3. Update Migration
migration_path = r'D:\MyProject\KaidNews\OlympicOEOBakand\database\migrations\2026_09_23_102450_add_absence_dates_to_player_medical_records_table.php'
with open(migration_path, 'r', encoding='utf-8') as f:
    mig_content = f.read()

if 'absence_from' not in mig_content:
    mig_up = """
        Schema::table('player_medical_records', function (Blueprint $table) {
            $table->date('absence_from')->nullable()->after('medical_decision');
            $table->date('absence_to')->nullable()->after('absence_from');
        });
"""
    mig_down = """
        Schema::table('player_medical_records', function (Blueprint $table) {
            $table->dropColumn(['absence_from', 'absence_to']);
        });
"""
    mig_content = mig_content.replace("        //", mig_up, 1)
    mig_content = mig_content.replace("        //", mig_down, 1)
    
    with open(migration_path, 'w', encoding='utf-8') as f:
        f.write(mig_content)
    print("Migration updated.")

print("All done.")
