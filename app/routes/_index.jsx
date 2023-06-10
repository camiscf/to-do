import * as fs from 'fs';

function readDatabase() {
  const data = fs.readFileSync('database.json');
  return JSON.parse(data);
}
export const meta = () => {
  return [
    { title: "To Do" },
    { 
      name: "description", content: "TO DO List" },
  ];
};

const database = readDatabase();

export default function Index() {
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
      <p>Cria a sua primeira lista</p>
    )}
    </div>
  );
}
