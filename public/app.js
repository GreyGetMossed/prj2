
const form = document.querySelector('#resume-form');
const formStatus = document.querySelector('#form-status');
const resumeStatus = document.querySelector('#resume-status');
const resumeItems = document.querySelector('#resume-items');
const buttonitems = document.querySelector('#buttonitems');
const template = document.querySelector('#resume-item-template');
const bttemplate = document.querySelector('#button-template')
const submitButton = form.querySelector('button[type="submit"]');
const cancelEditButton = document.querySelector('#cancel-edit');
const fields = [...form.querySelectorAll('input, textarea')];
let editingId = null;
let busy = false;
const getItemsButtons = document.querySelectorAll('.get-item');
// const getitem = document.getElementById('get-item');





function setBusy(value) {
  busy = value;
  submitButton.disabled = value;
  cancelEditButton.disabled = value;
  for (const field of fields) field.disabled = value;
  for (const button of resumeItems.querySelectorAll('button')) button.disabled = value;
}



function clearForm() {
  editingId = null;
  form.reset();
  submitButton.textContent = 'Add item';
  cancelEditButton.hidden = true;
  for (const field of fields) {
    field.setCustomValidity('');
    field.removeAttribute('aria-invalid');
    document.getElementById(`${field.id}-error`).textContent = '';
  }
}

function editItem(item) {
  if (busy) return;
  clearForm();
  editingId = item._id;
  for (const field of fields) field.value = item[field.name] ?? '';
  submitButton.textContent = 'Save changes';
  cancelEditButton.hidden = false;
  formStatus.textContent = 'Editing experience.';
  fields[0].focus();
}

cancelEditButton.addEventListener('click', () => {
  clearForm();
  formStatus.textContent = 'Edit cancelled.';
  fields[0].focus();
});

function validateField(field) {
  if (field.type === 'text' || field.tagName === 'TEXTAREA') {
    field.setCustomValidity(field.validity.valueMissing || field.value.trim() ? '' : 'Enter a value that is not just whitespace.');
  }
  
}

for (const field of fields) {
  field.addEventListener('input', () => validateField(field));
  field.addEventListener('blur', () => validateField(field));
}


//step one, make this happen on a button click instead of automatically

//we got a button but we have to stop it from running the fetch immediately while still loading the rest of it i think
 
async function loadItems() {
  
try{
 const response = await fetch(`/api/resume-items`);
 //derive category list from all data.

 const result = await response.json();
 console.log(result)
 let categories = new Set(result.map(result => result.category))
 console.log(categories)
 console.log(Array.from(categories))
 const cats = Array.from(categories)
 console.log(cats)
 const fragment = document.createDocumentFragment();
 for (const item of cats) {
  const node = bttemplate.content.cloneNode(true);
node.querySelector('.get-item').textContent = item;
node.querySelector('.get-item').setAttribute('id', item);
node.querySelector('.get-item').addEventListener('click', async (event) =>{
  resumeStatus.textContent = 'Loading experiences…';

  const element = event.target
  console.log(element)
  console.log(element.id)

  // console.log(element.id.value)
  try {
    const response = await fetch(`/api/resume-items?category=${element.id}`);
    if (!response.ok) throw new Error('Unable to load experiences. Please try again later.');
    const items = await response.json();
    const fragment = document.createDocumentFragment();
    for (const item of items) {
      const node = template.content.cloneNode(true);
      node.querySelector('article').dataset.itemId = item._id;
      node.querySelector('.job-title').textContent = item.category;
      
      node.querySelector('.employer').textContent = (`colour:  ${item.colour}`);
      node.querySelector('.quant').textContent = (`${item.quantity} left in storage`);
      node.querySelector('.dates').textContent =(`stored at: ${item.location}`);
      node.querySelector('.accomplishment').textContent = (`details: ${item.description}`);
      const editButton = node.querySelector('.edit-item');
      const deleteButton = node.querySelector('.delete-item');
      editButton.setAttribute('aria-label', `Edit ${item.job_title} at ${item.employer}`);
      deleteButton.setAttribute('aria-label', `Delete ${item.job_title} at ${item.employer}`);
      editButton.disabled = busy;
      deleteButton.disabled = busy;
      editButton.addEventListener('click', () => editItem(item));
      deleteButton.addEventListener('click', () => deleteItem(item, deleteButton.closest('article')));
      fragment.append(node);
    }
    resumeItems.replaceChildren(fragment);
    resumeStatus.textContent = items.length ? '' : 'No experiences yet. Add the first one above.';
    return true;
  } catch {
    resumeStatus.textContent = 'Open a Drawer to see your Collection.';
    return false;
  }

}
);
fragment.append(node);
  
 }
 buttonitems.replaceChildren(fragment);
 return true;
 //const modelname = await ResumeItem.find({category: "test"});
} catch{
 buttonitems.textContent = 'Open a Drawer to see your Collection.';
    return false;
}
}


// ok, got it running only when i click the button, now i need to be able to make it search for a specific category
//delete does it with item.category, but that's because it's stored inside an element, 
//if i can create a drop down and store the button under there maybe itll work the same way
//but for that drop down i still need to be able to search for a specific feild, and we run into the same dilemma

//it seems like i meed to use model.find but to do that i need to be able to get the model name, which i can't seem to do
//need to figure out how to import that variable without breaking things

async function deleteItem(item, article) {
  if (busy || !confirm(`Delete ${item.category} at ${item.employer}?`)) return;
  setBusy(true);
  resumeStatus.textContent = 'Deleting experience…';
  try {
    const response = await fetch(`/api/resume-item?id=${encodeURIComponent(item._id)}`, { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Unable to delete the experience. Please try again.');
    }
    article.remove();
    if (editingId === item._id) {
      clearForm();
      formStatus.textContent = 'The experience you were editing was deleted.';
    }
    if (await loadItems()) {
      resumeStatus.textContent = resumeItems.children.length ? 'Experience deleted.' : 'Experience deleted. No experiences yet.';
    }
    else resumeStatus.textContent = 'Experience deleted, but the resume could not be refreshed.';
  } catch (error) {
    resumeStatus.textContent = error.message || 'Unable to delete the experience. Please try again.';
  } finally {
    setBusy(false);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  formStatus.textContent = '';
  const validity = fields.map(validateField);
  if (validity.includes(false)) {
    fields[validity.indexOf(false)].focus();
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  if (!data.end_year) delete data.end_year;
  const isEditing = editingId !== null;
  const url = isEditing ? `/api/resume-item?id=${encodeURIComponent(editingId)}` : '/api/resume-item';
  setBusy(true);
  formStatus.textContent = 'Saving experience…';
  try {
    const response = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Unable to save the experience. Please try again.');
    }
    if (isEditing) {
      for (const article of resumeItems.querySelectorAll('article')) {
        if (article.dataset.itemId === editingId) article.remove();
      }
    }
    clearForm();
    formStatus.textContent = isEditing ? 'Experience updated.' : 'Experience saved.';
    if (!await loadItems()) formStatus.textContent = 'Experience saved, but the resume could not be refreshed.';
  } catch (error) {
    formStatus.textContent = error.message || 'Unable to save the experience. Please try again.';
  } finally {
    setBusy(false);
  }
});

loadItems();

