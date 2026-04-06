# Create Thunderous

> [!CAUTION]
> This project is experimental. It may not be suitable for production use at this time, as it is subject to bugs and breaking changes.

This package is used to create a new Thunderous project.

## Usage

To create a new project, the command is simple:

```bash
npx create thunderous
```

To create a project in the current directory, you can pass `.` to the same command.
This will skip a few prompts and use the parent folder name as the project name.

```bash
# Create a project in the current directory
npx create thunderous .
```

Alternatively, if you want to skip the prompts but choose a different project name, you can pass it as an argument:

```bash
npx create thunderous my-project
# scaffolds the project under a directory named "my-project", using "my-project" in package.json and other files.
```

## More Information

For more information on how to use this package, please see the [Thunderous documentation](https://thunderous.dev/docs/getting-started).

> **Note**: The documentation may not be up to date yet, and thus may not include information about the full Thunderous stack. Please refer to the [source code](https://github.com/thunder-solutions/thunderous/tree/trunk/packages/create-thunderous) for the latest information.
