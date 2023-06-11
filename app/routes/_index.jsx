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

function deleteItem(listIndex, itemIndex) {
  const database = readDatabase();
  database.lists[listIndex].items.splice(itemIndex, 1);

  fs.writeFileSync('database.json', JSON.stringify(database));

}

function deleteList(listIndex){
  const database = readDatabase();
  database.lists.splice(listIndex, 1);

  fs.writeFileSync('database.json', JSON.stringify(database));
}

function editItem(listIndex, itemIndex, newItemName) {
  const database = readDatabase();
  database.lists[listIndex].items[itemIndex].nameItem = newItemName;
  fs.writeFileSync('database.json', JSON.stringify(database));
}

function setCheck(listIndex, itemIndex, checked) {
  const database = readDatabase();
  const trueChecked = checked == 'true' ? true : false;

  database.lists[listIndex].items[itemIndex].checked = trueChecked;
  fs.writeFileSync('database.json', JSON.stringify(database));
}

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

  const type = form.get('type');
  if (type == 'deleteItem') {
    const listIndex = form.get('listIndex');
    const itemIndex = form.get('itemIndex');

    deleteItem(listIndex, itemIndex);


  }

  if (type == 'deleteList') {
    const listIndex = form.get('listIndex');
    deleteList(listIndex);
  }

  if (type == 'editItem') {
    const listIndex = form.get('listIndex');
    const itemIndex = form.get('itemIndex');
    const newItemName = form.get('newItemName');

    editItem(listIndex, itemIndex, newItemName);
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
  
  const edits = {};

  database.lists.forEach((list, listIndex) => {
    edits[listIndex] = {};
    edits[listIndex]['name'] = list.name;
    edits[listIndex]['items'] = {};
    list.items.forEach((item, itemIndex) => {
      edits[listIndex]['items'][itemIndex] = {};
      edits[listIndex]['items'][itemIndex]['name'] = item.nameItem;
      edits[listIndex]['items'][itemIndex]['editing'] = false;
    });
  })

  const [inputEdit, setInputEdit] = React.useState(edits);

  React.useEffect(() => {
    const edits = {};

    database.lists.forEach((list, listIndex) => {
      edits[listIndex] = {};
      edits[listIndex]['name'] = list.name;
      edits[listIndex]['items'] = {};
      list.items.forEach((item, itemIndex) => {
        edits[listIndex]['items'][itemIndex] = {};
        edits[listIndex]['items'][itemIndex]['name'] = item.nameItem;
        edits[listIndex]['items'][itemIndex]['editing'] = false;
      });
    });
  
    setInputEdit(edits);
  }, [database]);


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

  const handleEditItemConfirm = (e, listIndex, itemIndex) => {
    const obj = {...inputEdit};
    obj[listIndex].items[itemIndex].editing = false;
    setInputEdit(obj);

    const formData = new FormData();

    formData.append('type', 'editItem');
    formData.append('listIndex', listIndex);
    formData.append('itemIndex', itemIndex);
    formData.append('newItemName', inputEdit[listIndex].items[itemIndex].name);

    submit(formData, { method: 'post', action: '/?index', replace: true });
  }

  const handleEditItem = (e, listIndex, itemIndex) => {
    const obj = { ...inputEdit };
    obj[listIndex].items[itemIndex].name = e.target.value;
    setInputEdit(obj);
  }

  const handleItemFocus = (e, listIndex, itemIndex) => {
    const obj = { ...inputEdit };
    obj[listIndex].items[itemIndex].editing = true;
    setInputEdit(obj);
  }

  const handleInputItemChange = (e, index) => {
    const obj = {...inputItems};
    obj[index] = e.target.value;
    setInputItems(obj);
  }

  function handleDeleteItemClick(e, listIndex, itemIndex){
    const formData = new FormData();
  
    formData.append('type', 'deleteItem');
    formData.append('listIndex', listIndex);
    formData.append('itemIndex', itemIndex);
  
    submit(formData, { method: 'post', action: '/?index', replace: true });

  }

  function handleDeleteListClick(e, listIndex){
    const formData = new FormData();
  
    formData.append('type', 'deleteList');
    formData.append('listIndex', listIndex);
  
    submit(formData, { method: 'post', action: '/?index', replace: true });
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>To Do</h1>
      {database.lists.length > 0 ? (
        <div>
          {database.lists.map((list, index) => (
            <div key={index}>
              <h2>{list.name}</h2>
              <button id="delete" onClick={(e) => handleDeleteListClick(e, index)}>x</button>
              <ul>
                {list.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <input name='check' type ="checkbox" onChange={(e) => handleItemCheck(e, index, itemIndex)} checked={item.checked} />
                    <input value={inputEdit[index].items[itemIndex].name} onChange={(e) => handleEditItem(e, index, itemIndex)} onFocus={(e) => handleItemFocus(e, index, itemIndex)} onBlur={(e) => handleEditItemConfirm(e, index, itemIndex)} />
                    <button id="delete" onClick={(e) => handleDeleteItemClick(e, index, itemIndex)}>❌</button>
                    {inputEdit[index].items[itemIndex].editing && <button onClick={(e) => handleEditItemConfirm(e, index, itemIndex)}>✅</button>}
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