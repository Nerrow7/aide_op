const injuries = [
  'Balle 9 mm','Balle 5.56 mm','Balle 7.62 mm','Balle de fusil à pompe',
  'Éclat de balle','Verre','Couteau','Brûlure','Fracture','Hémorragie',
  'Traumatisme','Malaise'
];

const acts = [
  'Désinfection','Retrait de balle','Retrait de verre','Points de suture',
  'Pansement','Bandage','Garrot','Attelle','Scanner','Radio','Anti-douleur',
  'Perfusion','Transfusion','Oxygène','Massage cardiaque','Stabilisation'
];

const postop = [
  'Repos conseillé','Éviter les efforts','Mobilité réduite','Anti-douleurs',
  'Antibiotiques','Bandage à changer','Pansement à surveiller','Contrôle médical',
  'Retour si douleur','Repos 24h','Repos 48h','Arrêt temporaire','Reprise progressive'
];

const state = {
  zone: null,
  injuries: [],
  acts: new Set(),
  postop: new Set()
};

const injuryOptions = document.getElementById('injuryOptions');
const injuryList = document.querySelector('[data-injury-list]');
const zoneLabel = document.querySelector('[data-injury-zone]');
const actsRoot = document.getElementById('acts');
const postopRoot = document.getElementById('postop');

function makeButtons(root, values, set) {
  values.forEach(value => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-btn';
    button.textContent = value;

    button.addEventListener('click', () => {
      if (set.has(value)) {
        set.delete(value);
        button.classList.remove('active');
      } else {
        set.add(value);
        button.classList.add('active');
      }
    });

    root.appendChild(button);
  });
}

injuries.forEach(injury => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = injury;

  button.addEventListener('click', () => {
    if (!state.zone) {
      zoneLabel.textContent = 'Sélectionne d’abord une zone';
      return;
    }

    state.injuries.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random(),
      zone: state.zone,
      injury
    });

    renderInjuries();
  });

  injuryOptions.appendChild(button);
});

document.querySelectorAll('[data-body-zone]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-body-zone]').forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');
    state.zone = button.dataset.bodyZone;
    zoneLabel.textContent = state.zone;
  });
});

function renderInjuries() {
  injuryList.innerHTML = '';

  if (!state.injuries.length) {
    injuryList.innerHTML = '<div class="empty">Aucune blessure sélectionnée.</div>';
    return;
  }

  state.injuries.forEach(item => {
    const row = document.createElement('div');
    row.className = 'injury-entry';
    row.innerHTML = `
      <div><b>${escapeHtml(item.zone)}</b> — ${escapeHtml(item.injury)}</div>
      <button type="button" class="remove-btn" aria-label="Supprimer">×</button>
    `;

    row.querySelector('button').addEventListener('click', () => {
      state.injuries = state.injuries.filter(i => i.id !== item.id);
      renderInjuries();
    });

    injuryList.appendChild(row);
  });
}

makeButtons(actsRoot, acts, state.acts);
makeButtons(postopRoot, postop, state.postop);

function generateReport() {
  const patient = document.getElementById('patient').value.trim();
  const doctor = document.getElementById('doctor').value.trim();
  const operationType = document.getElementById('operationType').value;

  const grouped = {};
  state.injuries.forEach(({zone, injury}) => {
    if (!grouped[zone]) grouped[zone] = [];
    grouped[zone].push(injury);
  });

  const injuryText = Object.entries(grouped)
    .map(([zone, values]) => `- ${zone} : ${values.join(', ')}`)
    .join('\n');

  const lines = [];
  lines.push(`TYPE D'INTERVENTION : ${operationType}`);
  if (patient) lines.push(`PATIENT : ${patient}`);
  if (doctor) lines.push(`PRISE EN CHARGE PAR : ${doctor}`);

  lines.push('');
  lines.push('BLESSURES CONSTATÉES');
  lines.push(injuryText || '- Aucune blessure renseignée');

  lines.push('');
  lines.push('ACTES RÉALISÉS');
  lines.push(state.acts.size ? [...state.acts].map(v => `- ${v}`).join('\n') : '- Aucun acte renseigné');

  lines.push('');
  lines.push('SOINS / CONSIGNES POST-OPÉRATOIRES');
  lines.push(state.postop.size ? [...state.postop].map(v => `- ${v}`).join('\n') : '- Aucune consigne renseignée');

  lines.push('');
  lines.push('ÉTAT DU PATIENT');
  lines.push('Patient pris en charge et stabilisé selon les éléments renseignés.');

  document.getElementById('report').value = lines.join('\n');
}

document.getElementById('generateBtn').addEventListener('click', generateReport);

document.getElementById('copyBtn').addEventListener('click', async () => {
  const report = document.getElementById('report');
  const status = document.getElementById('copyStatus');

  if (!report.value.trim()) generateReport();

  try {
    await navigator.clipboard.writeText(report.value);
    status.textContent = 'Compte rendu copié.';
  } catch {
    report.select();
    document.execCommand('copy');
    status.textContent = 'Compte rendu copié.';
  }

  setTimeout(() => status.textContent = '', 1800);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  state.zone = null;
  state.injuries = [];
  state.acts.clear();
  state.postop.clear();

  document.getElementById('patient').value = '';
  document.getElementById('doctor').value = '';
  document.getElementById('operationType').selectedIndex = 0;
  document.getElementById('report').value = '';

  document.querySelectorAll('.active,.selected').forEach(el => el.classList.remove('active','selected'));
  zoneLabel.textContent = 'Sélectionne une zone';
  renderInjuries();
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[char]));
}
