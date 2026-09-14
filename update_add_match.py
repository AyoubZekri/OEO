import os
import re

file_path = 'src/View/Screen/Matches/AddMatchDialog.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update initial form state
content = content.replace(
    "admin_id: matchData?.admin_id?.toString() || ''",
    "admin_id: matchData?.admin_id?.toString() || '',\n    team_score: matchData?.team_score !== undefined ? matchData?.team_score : '',\n    opponent_score: matchData?.opponent_score !== undefined ? matchData?.opponent_score : '',\n    match_status: matchData?.match_status || ''"
)

content = content.replace(
    "admin_id: ''",
    "admin_id: '',\n      team_score: '',\n      opponent_score: '',\n      match_status: ''"
)

# Add UI components before buttons
new_fields = '''
          <div className="responsive-grid-2">
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-h)' }}>حالة المباراة</label>
              <select 
                value={formData.match_status || ''}
                onChange={e => setFormData({...formData, match_status: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', height: '42px', fontFamily: 'inherit' }}
              >
                <option value="">مبرمجة / لم تُلعب بعد</option>
                <option value="ملعوبة">ملعوبة</option>
                <option value="مؤجلة">مؤجلة</option>
                <option value="ملغاة">ملغاة</option>
              </select>
            </div>
          </div>
          
          {(formData.match_status === 'ملعوبة' || formData.match_status === '') && (
            <div className="responsive-grid-2" style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <CustomInput
                label="أهداف فريقنا"
                type="number"
                value={formData.team_score || ''}
                onChange={e => setFormData({...formData, team_score: e.target.value})}
              />
              <CustomInput
                label="أهداف الخصم"
                type="number"
                value={formData.opponent_score || ''}
                onChange={e => setFormData({...formData, opponent_score: e.target.value})}
              />
            </div>
          )}
'''

buttons_section = '''          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>'''
content = content.replace(buttons_section, new_fields + '\n' + buttons_section)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
