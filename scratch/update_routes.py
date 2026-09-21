import os

base = r'..\OlympicOEOBakand'
routes_append = r'''
use App\Http\Controllers\ClubController;
Route::get('/clubs', [ClubController::class, 'index']);
Route::post('/clubs/create', [ClubController::class, 'store']);
Route::post('/clubs/update/{id}', [ClubController::class, 'update']);
Route::delete('/clubs/delete/{id}', [ClubController::class, 'destroy']);
'''

api_path = os.path.join(base, 'routes/api.php')
with open(api_path, 'a', encoding='utf-8') as f:
    f.write(routes_append)

print('Routes appended successfully!')
