import { Command } from "commander";
import { promises as fsPromises } from "fs";
import chalk from "chalk";

const program = new Command();
const log = console.log;

// Helper function to read file safely
/**
 * Reads a JSON file and parses its content.
 * If the file does not exist or is empty, returns a default value.
 *
 * @param {string} filePath - The path to the JSON file.
 * @param {Object} [defaultValue={}] - The default value to return if the file does not exist or is empty.
 * @returns {Promise<Object>} The parsed JSON content or the default value.
 * @throws Will rethrow any error that is not related to the file not existing.
 */
async function readJSONFile(filePath, defaultValue = {}) {
  try {
    const data = await fsPromises.readFile(filePath, "utf-8");
    if (!data) return defaultValue; // Return default value if file is empty
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // If file doesn't exist, return the default value
      return defaultValue;
    }
    throw error; // Rethrow any other errors
  }
}

program
  .name("To-Do List")
  .description(
    "A To-Do List is a simple and effective productivity tool designed to help you organize tasks, set priorities, and track progress"
  )
  .version("0.8.0");

// add task to todo list
program
  .command("add")
  .description("create a new item on your To-Do List")
  .requiredOption("-t, --title <string>", "The Title of The Task")
  .option(
    "-s, --status [value]",
    "The status of the task should be one from these values [todo, doing, done]"
  )
  .action(async (options) => {
    try {
      // Read db.json or initialize it if empty
      const db = await readJSONFile("db.json", []);

      // Check if the task with the same title already exists in the DB
      const taskExists = db.some((task) => task.title === options.title);

      if (taskExists) {
        log(chalk.yellow("This task already exists in your To-Do list!"));
        return; // Exit the function if task already exists
      }

      // Read counter.json or initialize it if empty
      const ctr = await readJSONFile("counter.json", { counter: 0 });

      // Increment counter
      ctr.counter++;

      // Set default status to 'todo' if not specified
      if (!options.status) {
        options.status = "todo";
      }

      // Add new task
      db.push({
        id: ctr.counter,
        title: options.title,
        status: options.status,
      });

      log(db); // Log the current DB content

      // Write updated counter and db back to files
      await fsPromises.writeFile("counter.json", JSON.stringify(ctr, null, 4));
      await fsPromises.writeFile("db.json", JSON.stringify(db, null, 4));

      log(chalk.green("Task added successfully!"));
    } catch (error) {
      console.error(chalk.red("Error occurred while adding the task:"));
      console.error(error);
    }
  });

// edit task from todo list
program
  .command("edit")
  .description("edit an item from your To-Do List")
  .requiredOption("-t, --title <string>", "The Title of The Task")
  .requiredOption("-i, --id <number>", "The id of The Task")
  .option(
    "-s, --status [value]",
    "The status of the task should be one from these values [todo, doing, done]"
  )
  .action(async (options) => {
    try {
      // Read db.json or initialize it if empty
      const db = await readJSONFile("db.json", []);

      // Find the task by id
      const taskIndex = db.findIndex(
        (task) => task.id === parseInt(options.id)
      );

      if (taskIndex === -1) {
        log(chalk.red("Task with the given ID not found!"));
        return; // Exit if task with given ID is not found
      }

      // Edit the task properties if they are provided
      if (options.title) db[taskIndex].title = options.title;
      if (options.status) db[taskIndex].status = options.status;

      // Write the updated db back to the file
      await fsPromises.writeFile("db.json", JSON.stringify(db, null, 4));

      log(chalk.green("Task updated successfully!"));
      log("Current DB:", db); // Log the current DB content
    } catch (error) {
      console.error(chalk.red("Error occurred while editing the task:"));
      console.error(error);
    }
  });

// Delete task from todo list
program
  .command("delete")
  .description("delete an item from your To-Do List")
  .requiredOption("-i, --id <number>", "The id of The Task")
  .action(async (options) => {
    try {
      // Read db.json or initialize it if empty
      const db = await readJSONFile("db.json", []);

      // Find the task by id
      const taskIndex = db.findIndex(
        (task) => task.id === parseInt(options.id)
      );
      if (taskIndex === -1) {
        log(chalk.red("Task with the given ID not found!"));
        return; // Exit if task with given ID is not found
      }

      // Delete the task properties if they are provided
      db.splice(taskIndex, 1);

      // Read counter.json or initialize it if empty
      const ctr = await readJSONFile("counter.json", { counter: 0 });

      // Increment counter
      ctr.counter--;

      // Write the updated db back to the file
      await fsPromises.writeFile("db.json", JSON.stringify(db, null, 4));
      await fsPromises.writeFile("counter.json", JSON.stringify(ctr, null, 4));
      log(chalk.green("Task updated successfully!"));
      log("Current DB:", db); // Log the current DB content
    } catch (error) {
      console.error(chalk.red("Error occurred while deleting the task:"));
      console.error(error);
    }
  });

//list tasks
program
  .command("list")
  .description("list all tasks in your todo list")
  .action(async () => {
    const db = await readJSONFile("db.json", []);
    db.forEach((element) => {
      log(element);
    });
  });

program
  .command("filter")
  .description("list all tasks in your todo list based on status")
  .option(
    "-s, --status <string>",
    "status of the task between 3 values [todo,doing,done] "
  )
  .action(async (options) => {
    const db = await readJSONFile("db.json", []);
    db.filter((element) => {
      if (element.status === options.status) {
        for (let key in element) {
          log(`${chalk.redBright(key)}: ${chalk.blue(element[key])}`);
        }
        log(
          chalk.yellowBright(
            "=============================================="
          )
        );
      }
    });
  });

program.parse();
