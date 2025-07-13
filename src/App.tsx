import { useEffect, useState } from "react";
import {
  Authenticator,
  useAuthenticator,
  Flex,
  TextAreaField,
  Loader,
  Text,
  View,
  Button,
} from "@aws-amplify/ui-react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAIGeneration } from "./client";

const client = generateClient<Schema>();

function AppContent() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [description, setDescription] = useState("");

  const [{ data, isLoading }, generateContent] = useAIGeneration("generateRecipe");

  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });

    return () => sub.unsubscribe();
  }, []);

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({ content });
    }
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  const handleGenerate = () => {
    generateContent({ description });
  };

  return (
    <Flex direction="column" padding="2rem" gap="2rem">
      <h1>{user?.signInDetails?.loginId}'s todos</h1>
      <Button onClick={createTodo}>Agregar un todo</Button>
      <ul>
        {todos.map((todo) => (
          <li onClick={() => deleteTodo(todo.id)} key={todo.id}>
            {todo.content}
          </li>
        ))}
      </ul>

      <Flex direction="column" gap="1rem">
        <TextAreaField
          autoResize
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          label="Descripción para generar receta"
        />
        <Button onClick={handleGenerate}>Generar receta</Button>

        {isLoading ? (
          <Loader variation="linear" />
        ) : (
          data?.name && (
            <>
              <Text fontWeight="bold">{data.name}</Text>
              <View as="ul">
                {data.ingredients?.map((ingredient) => (
                  <View as="li" key={ingredient}>
                    {ingredient}
                  </View>
                ))}
              </View>
              <Text>{data.instructions}</Text>
            </>
          )
        )}
      </Flex>

      <Button onClick={signOut}>Sign out</Button>
    </Flex>
  );
}

export default function App() {
  return (
    <Authenticator>
      <AppContent />
    </Authenticator>
  );
}
