import { redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useSubmit } from '@remix-run/react';
import { getSession, commitSession } from "../sessions";
import * as fs from 'fs';
import * as React from "react";

let session;
let userId;

const FILE = 'database.json';

export const meta = () => {
  return [
    { title: "To Do" },
    { 
      name: "description", content: "TO DO List" },
  ];
};

  
export async function readDatabase() {
  const data = fs.readFileSync(FILE);

  const parsedData = JSON.parse(data);

  return parsedData;
}

export async function getUser() {
  const database = await readDatabase();

  return database[userId];
}

export async function loader({ request }) {
  session = await getSession(
    request.headers.get("Cookie")
  );

  userId = session.get("userId");

  return await getUser();
}

export async function action({ request }) {
  session = await getSession(
    request.headers.get("Cookie")
  );

  userId = session.get("userId");

  const form = await request.formData();

  const checked = form.get('checked');
  if (checked !== null) {
    const listIndex = form.get('listIndex');
    const itemIndex = form.get('itemIndex');

    await setCheck(listIndex, itemIndex, checked);
  }

  const listName = form.get('listName');
  if (listName) {
    const list = {
      "name": listName,
      "items": [
      ],
    }
    await writeDatabase(list);
  }

  const itemName = form.get('itemName');
  if(itemName){
    const listIndex = form.get('listIndex');
    await writeItem(listIndex,itemName);
  }

  const type = form.get('type');
  if (type == 'deleteItem') {
    const listIndex = form.get('listIndex');
    const itemIndex = form.get('itemIndex');
    await deleteItem(listIndex, itemIndex);
  }

  if (type == 'deleteList') {
    const listIndex = form.get('listIndex');
    await deleteList(listIndex);
  }

  if (type == 'editItem') {
    const listIndex = form.get('listIndex');
    const itemIndex = form.get('itemIndex');
    const newItemName = form.get('newItemName');

    await editItem(listIndex, itemIndex, newItemName);
  }

  if (type == 'editList') {
    const listIndex = form.get('listIndex');
    const newListName = form.get('newListName');

    await editList(listIndex, newListName);
  }

  async function writeDatabase(list) {
    const database = await readDatabase();
    const user = await getUser();

    user.lists.push(list);
    database[userId] = user;

    fs.writeFileSync(FILE, JSON.stringify(database));
  }
  
  async function writeItem(listIndex, itemName){
    const database = await readDatabase();
    const user = await getUser();

    const item = {
      "nameItem" : itemName,
      "checked": false,
    }
    user.lists[Number(listIndex)].items.push(item);
    database[userId] = user;

    fs.writeFileSync(FILE, JSON.stringify(database));
  }
  
  async function deleteItem(listIndex, itemIndex) {
    const database = await readDatabase();
    const user = await getUser();

    user.lists[listIndex].items.splice(itemIndex, 1);
    database[userId] = user;

    fs.writeFileSync(FILE, JSON.stringify(database));
  
  }
  
  async function deleteList(listIndex){
    const database = await readDatabase();
    const user = await getUser();

    user.lists.splice(listIndex, 1);
    database[userId] = user;

    fs.writeFileSync(FILE, JSON.stringify(database));
  }
  
  async function editItem(listIndex, itemIndex, newItemName) {
    const database = await readDatabase();
    const user = await getUser();
    user.lists[listIndex].items[itemIndex].nameItem = newItemName;
    database[userId] = user;

    fs.writeFileSync(FILE, JSON.stringify(database));
  }
  
  async function editList(listIndex, newListName) {
    const database = await readDatabase();
    const user = await getUser();

    user.lists[listIndex].name = newListName;
    database[userId] = user;
    fs.writeFileSync(FILE, JSON.stringify(database));
  }
  async function setCheck(listIndex, itemIndex, checked) {
    const database = await readDatabase();
    const user = await getUser();

    const trueChecked = checked == 'true' ? true : false;
  
    user.lists[listIndex].items[itemIndex].checked = trueChecked;

    database[userId] = user;

    fs.writeFileSync(FILE, JSON.stringify(database));
  }

  return redirect('/?index');
}

export default function Index() {
  const database = useLoaderData();
  useActionData();
  const submit = useSubmit();

  const [inputList, setInputList] = React.useState("");


  const inputs = {};

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
  }, [database.lists]);



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
  const handleEditListConfirm = (e, listIndex) => {
    const obj = {...inputEdit};
    obj[listIndex].editing = false;
    setInputEdit(obj);

    const formData = new FormData();

    formData.append('type', 'editList');
    formData.append('listIndex', listIndex);
    formData.append('newListName', inputEdit[listIndex].name);

    submit(formData, { method: 'post', action: '/?index', replace: true });
  }
  const handleEditItem = (e, listIndex, itemIndex) => {
    const obj = { ...inputEdit };
    obj[listIndex].items[itemIndex].name = e.target.value;
    setInputEdit(obj);
  }

  const handleEditList = (e, listIndex) => {
    const obj = { ...inputEdit };
    obj[listIndex].name = e.target.value;
    setInputEdit(obj);
  }

  const handleItemFocus = (e, listIndex, itemIndex) => {
    const obj = { ...inputEdit };
    obj[listIndex].items[itemIndex].editing = true;
    setInputEdit(obj);
  }
  const handleListFocus = (e, listIndex) => {
    const obj = { ...inputEdit };
    obj[listIndex].editing = true;
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
    <div className="font-roboto m-0 tx-[#101935] h-full">
      <h1 className='text-5xl font-bold translate ml-10 mt-5'>to do list</h1>
      {database.lists.length > 0 ? (
        <div className='flex flex-row'>
          {database.lists.map((list, index) => (
            <div className='bg-[#8B8BAE] w-auto h-full rounded-xl first:ml-10 mr-8 mt-10 mb-10 py-4 px-7 ' key={index}>
              {/* nome da lista */}
              <div className='flex w-auto'>
                {inputEdit[index] && <input  className='rounded bg-transparent  w-fit py-1 px-1 text-2xl font-bold focus:outline-none hover:cursor-pointer hover:bg-[#7B7BA3] ' value={inputEdit[index].name} onChange={(e) => handleEditList(e, index)} onFocus={(e) => handleListFocus(e, index)} onBlur={(e) => handleEditListConfirm(e, index)} />}
                <button className='mr-4' id="delete" onClick={(e) => handleDeleteListClick(e, index)}>❌</button>
              </div>
              <ul>
                {list.items.map((item, itemIndex) => (
                  <li className='' key={itemIndex}>
                    <input name='check'  className='w-5 h-5 outline-none translate-y-1 border-none rounded-lg focus:ring-0' type ="checkbox" onChange={(e) => handleItemCheck(e, index, itemIndex)} checked={item.checked} />
                    {inputEdit[index] && inputEdit[index].items[itemIndex] && <input className='rounded ml-3 mt-2 mb-2 mr-5 w-9/12 py-2 px-1 bg-transparent text-lg outline-none focus:outline-none hover:cursor-pointer hover:bg-[#7B7BA3]' value={inputEdit[index].items[itemIndex].name} onChange={(e) => handleEditItem(e, index, itemIndex)} onFocus={(e) => handleItemFocus(e, index, itemIndex)} onBlur={(e) => handleEditItemConfirm(e, index, itemIndex)} /> }
                    <button id="delete" onClick={(e) => handleDeleteItemClick(e, index, itemIndex)}>❌</button>
                  </li>
                ))}
              </ul>
              <div> 
                  <input id="newItem" className='rounded w-10/12 py-2 px-2 bg-transparent text-base outline-none focus:outline-none hover:cursor-pointer hover:bg-[#7B7BA3] placeholder-black mr-5' type="text" onChange={(e) => handleInputItemChange(e, index)} value={inputItems[index]} name='itemName' placeholder='Adicione uma tarefa'/>
                  <button id="submit" onClick={(e) => handleChangeItem(e, index)}>➕</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
      <p>Cria a sua primeira lista!</p>
      )}
        <Form method='post' name='createList'>
          <input id="newList" type="text"  className='rounded ml-10 w-10/12 py-2 px-2 bg-red-600 text-base outline-none focus:outline-none hover:cursor-pointer hover:bg-[#7B7BA3] placeholder-black mr-5'
          onChange={handleChangeList} value={inputList} name='listName' placeholder='Nome da Lista'/>
          <button id="submit" type="submit">➕</button>
        </Form>
      </div>
  );
}