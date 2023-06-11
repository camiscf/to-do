import { redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import * as fs from 'fs';
import * as React from "react";

function readDatabase() {
  const data = fs.readFileSync('database.json');
  return JSON.parse(data);
}

function writeDatabase(list) {
  const database = readDatabase();

  database.lists.push(list);

  fs.writeFileSync('database.json', JSON.stringify(database));
}

export const meta = () => {
  return [
    { title: "To Do" },
    { 
      name: "description", content: "TO DO List" },
  ];
};

export async function loader() {
  return readDatabase();
}

export async function action({ request }) {
  const form = await request.formData();

  const listName = form.get('listName');

  const list = {
    "name": listName,
    "items": [],
  }

  writeDatabase(list);

  return redirect('/?index');
}

export default function Index() {
  const [inputList, setInputList] = React.useState("");

  const handleChange = (e) => {
    setInputList(e.target.value);
  };

  const database = useLoaderData();
  useActionData();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>To Do</h1>
      {database.lists.length > 0 ? (
        <div>
          {database.lists.map((list, index) => (
            <div key={index}>
              <h2>{list.name}</h2>
              <ul>
                {list.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
    ) : (
      <p>Cria a sua primeira lista!</p>
    )}
      <Form method='post' name='criarLista'>
        <input id="newList" type="text" onChange={handleChange} value={inputList} name='listName' placeholder='Nome da Lista'/>
        <button id="submit" type="submit">Criar lista</button>
      </Form>
    </div>
    
  );
}

