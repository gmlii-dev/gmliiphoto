import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import '@aws-amplify/ui-react/styles.css';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.image) return;
    if (!formData.name) {
        formData.name = "";
    }
    if (!formData.description) {
      formData.description = "";
    }
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="App">
          <h1>George and Miranda's Galapagos Adventure</h1>
          <input
            type="file"
            accept="image/png, image/jpeg"

            onChange={onChange}
          />
          <input
            onChange={e => setFormData({ ...formData, 'description': e.target.value})}
            placeholder="Optional Image Note"
            value={formData.description}
          />
          <button onClick={createNote}>Add Image</button>
            <div style={{marginBottom: 30}}>
              {
                notes.map(note => (
                    <div key={note.id || note.name}>
                      <h2>{note.name}</h2>
                      <p>{note.description}</p>
                      <button onClick={() => deleteNote(note)}>Delete Image</button>
                      {
                        note.image && <img src={note.image} style={{width: 400}} />
                      }
                    </div>
                  ))
                }
            </div>
            <button onClick={signOut}>Sign out</button>
          </div>
        )}
      </Authenticator>
  );
}
export default App;
