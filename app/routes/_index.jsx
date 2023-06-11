import { redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useSubmit } from '@remix-run/react';
import * as fs from 'fs';
import * as React from "react";

export const meta = () => {
  return [
    { title: "To Do" },
    { 
      name: "description", content: "TO DO List" },
  ];
};

function readDatabase() {
  const data = fs.readFileSync('database.json');
  return JSON.parse(data);
}

function writeDatabase(list) {
  const database = readDatabase();
  database.lists.push(list);
  fs.writeFileSync('database.json', JSON.stringify(database));
}

function writeItem(listIndex, itemName){
  const database = readDatabase();
  const item = {
    "nameItem" : itemName,
    "checked": false,
  }
  database.lists[Number(listIndex)].items.push(item);
  fs.writeFileSync('database.json', JSON.stringify(database));
}

function setCheck(listIndex, itemIndex, checked) {
  const database = readDatabase();
  const trueChecked = checked == 'true' ? true : false;

  database.lists[listIndex].items[itemIndex].checked = trueChecked;
  fs.writeFileSync('database.json', JSON.stringify(database));
}

// function deleteItem(listIndex, itemIndex){
//   const database = readDatabase();
//   delete database.lists[listIndex].items[itemIndex]
// }

export async function loader() {
  return readDatabase();
}

export async function action({ request }) {
  const form = await request.formData();

  const checked = form.get('checked');
  if (checked !== null) {
    const listIndex = form.get('listIndex');
    const itemIndex = form.get('itemIndex');

    setCheck(listIndex, itemIndex, checked);
  }

  const listName = form.get('listName');
  if (listName) {
    const list = {
      "name": listName,
      "items": [
      ],
    }
    writeDatabase(list);
  }

  const itemName = form.get('itemName');
  if(itemName){
    const listIndex = form.get('listIndex');
    writeItem(listIndex,itemName);
  }

  return redirect('/?index');
}

export default function Index() {
  const database = useLoaderData();
  useActionData();
  const submit = useSubmit();

  const [inputList, setInputList] = React.useState("");

  const inputs = {};

  database.lists.forEach((list, index) => {
    inputs[index] = "";
  });

  const [inputItems, setInputItems] = React.useState(inputs);
  
  const handleChangeList = (e) => {
    setInputList(e.target.value);
  };

  const handleChangeItem = (e, listIndex) =>{
    const formData = new FormData();
    formData.append('itemName', inputItems[listIndex]);
    formData.append('listIndex', listIndex);

    const obj = {...inputItems};
    obj[listIndex] = "";
    setInputItems(obj);
    
    submit(formData, { method: 'post', action: '/?index', replace : true});
  }

  const handleItemCheck = (e, listIndex, itemIndex) => {
    const formData = new FormData();

    formData.append('checked', e.target.checked);
    formData.append('listIndex', listIndex);
    formData.append('itemIndex', itemIndex);

    submit(formData, { method: 'post', action: '/?index', replace: true });
  }

  const handleInputItemChange = (e, index) => {
    const obj = {...inputItems};
    obj[index] = e.target.value;
    setInputItems(obj);
  }

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
                  <li key={itemIndex}>
                    <input name='check' type ="checkbox" onChange={(e) => handleItemCheck(e, index, itemIndex)} checked={item.checked} />
                    <label>{item.nameItem}</label>
                    {/* <button id="delete" type="submit" onClick={deleteItem(index, itemIndex)}>x</button> */}
                  </li>
                ))}
              </ul>
              <div> 
                  <input id="newItem" type="text" onChange={(e) => handleInputItemChange(e, index)} value={inputItems[index]} name='itemName' placeholder='Adicione uma tarefa'/>
                  <button id="submit" onClick={(e) => handleChangeItem(e, index)}>adicionar tarefa</button>
              </div>
            </div>
          ))}
        </div>
    ) : (
      <p>Cria a sua primeira lista!</p>
    )}
      <Form method='post' name='createList'>
        <input id="newList" type="text" onChange={handleChangeList} value={inputList} name='listName' placeholder='Nome da Lista'/>
        <button id="submit" type="submit">Criar lista</button>
      </Form>
    </div>
    
  );
}