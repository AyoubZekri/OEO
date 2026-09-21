import os
from datetime import datetime

base = r'..\OlympicOEOBakand'

# 1. Model
model_content = r'''<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Club extends Model
{
    use HasFactory;
    protected $fillable = ['name', 'symbol', 'logo'];
}
'''
with open(os.path.join(base, 'app/Models/Club.php'), 'w', encoding='utf-8') as f:
    f.write(model_content)

# 2. Controller
controller_content = r'''<?php
namespace App\Http\Controllers;

use App\Models\Club;
use Illuminate\Http\Request;

class ClubController extends Controller
{
    public function index()
    {
        return response()->json(Club::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'nullable|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->except('logo');

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('clubs', 'public');
            $data['logo'] = url('storage/' . $path);
        }

        $club = Club::create($data);
        return response()->json($club, 201);
    }

    public function update(Request $request, $id)
    {
        $club = Club::findOrFail($id);
        
        $data = $request->except('logo');

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('clubs', 'public');
            $data['logo'] = url('storage/' . $path);
        }

        $club->update($data);
        return response()->json($club);
    }

    public function destroy($id)
    {
        Club::destroy($id);
        return response()->json(['message' => 'Club deleted successfully']);
    }
}
'''
with open(os.path.join(base, 'app/Http/Controllers/ClubController.php'), 'w', encoding='utf-8') as f:
    f.write(controller_content)

# 3. Migration
date_prefix = datetime.now().strftime('%Y_%m_%d_%H%M%S')
migration_filename = f'{date_prefix}_create_clubs_table.php'
migration_content = r'''<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clubs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('symbol')->nullable();
            $table->string('logo')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clubs');
    }
};
'''
with open(os.path.join(base, f'database/migrations/{migration_filename}'), 'w', encoding='utf-8') as f:
    f.write(migration_content)

print('Done creating backend files!')
