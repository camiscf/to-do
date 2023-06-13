import { v4 as uuidv4 } from "uuid";
import { Form, Link, useLoaderData } from "@remix-run/react";
import * as fs from "fs";
import { readDatabase, getUser } from "./_index";
import { redirect } from '@remix-run/node';
import { getSession, commitSession } from "../sessions";


const FILE = 'database.json';

export async function action({ request }) {
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");


  async function writeDatabase(username, password) {
    const database = await readDatabase();
    const user = await getUser();

    const id = uuidv4();

    const newUser = {
      id: id,
      username: username,
      password: password,
      lists: [],
    };
    database[id] = newUser;

    fs.writeFileSync(FILE, JSON.stringify(database));

    return id;
    }

  if(username && password){
    const session = await getSession(
        request.headers.get("Cookie")
    );
    
    const userId = await writeDatabase(username,password);

    session.set("userId", userId);

    return redirect("/?index", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}
}

export default function Posts() {
  return (
    <div className='font-roboto m-0 tx-[#101935]'>
      <Form method="POST" className='flex flex-col justify-center'>
        <div>
          <h1 className='text-5xl font-bold translatemt-5 ml-[38%] my-10'>Faça o seu cadastro</h1>
        </div>
        <div className='flex flex-col bg-[#8B8BAE] w-1/3 h-96 rounded align-center mx-[35%]'>
          <label className='text-2xl flex flex-col ml-[15%] mt-[10%]'>
            Usuário: <input autocomplete="off" className='rounded bg-[#7B7BA3] mt-2 w-[80%] py-1 px-1 text-base font-bold focus:outline-none hover:cursor-pointer ' type="text" name="username" required />
          </label>
          <label className='text-2xl flex flex-col ml-[15%] mt-[5%]'>
            Senha: <input autocomplete="off" className='rounded bg-[#7B7BA3] mt-2 w-[80%] p-1 text-base font-bold focus:outline-none hover:cursor-pointer ' type="password" name="password" required />
          </label>
          <button className='text-base bg-[#626282] hover:bg-[#272f49] rounded w-32 h-10 px-5 py-2 flex flex-col ml-[35%] mt-[5%]' type="submit">Cadastrar</button>
        </div>
      </Form>
    </div>
    
  );
}
