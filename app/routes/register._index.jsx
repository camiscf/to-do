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
    <div>
      <h1>Cadastre</h1>
      <Form method="POST">
        <div>
          <p>Please sign in</p>
        </div>
        <label>
          Username: <input type="text" name="username" required />
        </label>
        <label>
          Password: <input type="password" name="password" required />
        </label>
        <button type="submit">Fazer cadastro</button>
      </Form>
    </div>
  );
}
