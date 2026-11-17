#!/usr/bin/env node
// convert-theme.js
// Moves a Pesa screen or component from the fixed `colors` constant to the theme hook.
//
//   node convert-theme.js src/screens/Setup.tsx [more files...]
//
// What it does, per file:
//   1. import { colors, ... } from ".../constants/theme"  ->  keeps the other names, adds
//      import { createStyles, useTheme } from ".../lib/ThemeContext"
//   2. const styles = StyleSheet.create({...})  ->  const useStyles = createStyles((colors) => ({...}))
//   3. inside each component that uses `styles` or `colors`, adds
//      const { colors } = useTheme();   and/or   const styles = useStyles();
// Anything it cannot change safely is printed as "MANUAL" with a line number.
// It needs the `typescript` package (every Expo TypeScript project already has it).
const fs = require("fs");
const path = require("path");

let ts;
try {
  ts = require(
    require.resolve("typescript", { paths: [process.cwd(), __dirname] }),
  );
} catch {
  console.error(
    'Cannot find the "typescript" package. Run this from your project folder.',
  );
  process.exit(1);
}

function convert(file) {
  const original = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(
    file,
    original,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const manual = [];
  const edits = []; // { start, end, text }
  const lineOf = (node) =>
    sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;

  // ---- 1. find the theme import ----
  const themeImport = sf.statements.find(
    (s) =>
      ts.isImportDeclaration(s) &&
      /constants\/theme$/.test(s.moduleSpecifier.text) &&
      s.importClause &&
      s.importClause.namedBindings &&
      ts.isNamedImports(s.importClause.namedBindings),
  );
  if (!themeImport) return { skipped: "no import from constants/theme" };

  const specs = themeImport.importClause.namedBindings.elements;
  if (!specs.some((e) => e.name.text === "colors"))
    return { skipped: "does not use `colors`" };
  if (/useStyles|createStyles/.test(original))
    return { skipped: "already converted" };

  const themePath = themeImport.moduleSpecifier.text;
  const ctxPath = themePath.replace(/constants\/theme$/, "lib/ThemeContext");

  // ---- helpers ----
  function isUse(node, name) {
    // Identifier `name` used as a value (not as x.name, not as a { name: ... } key)
    if (!ts.isIdentifier(node) || node.text !== name) return false;
    const p = node.parent;
    if (ts.isPropertyAccessExpression(p) && p.name === node) return false;
    if (ts.isPropertyAssignment(p) && p.name === node) return false;
    if (ts.isImportSpecifier(p)) return false;
    return true;
  }
  function uses(node, name) {
    let found = false;
    (function walk(n) {
      if (found) return;
      if (isUse(n, name)) {
        found = true;
        return;
      }
      ts.forEachChild(n, walk);
    })(node);
    return found;
  }
  function declares(node, name) {
    let found = false;
    (function walk(n) {
      if (found) return;
      if (
        (ts.isVariableDeclaration(n) ||
          ts.isParameter(n) ||
          ts.isBindingElement(n)) &&
        ts.isIdentifier(n.name) &&
        n.name.text === name
      ) {
        found = true;
        return;
      }
      ts.forEachChild(n, walk);
    })(node);
    return found;
  }

  // ---- 2. the styles object ----
  let stylesStmt = null;
  let stylesCall = null;
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (
        ts.isIdentifier(d.name) &&
        d.name.text === "styles" &&
        d.initializer &&
        ts.isCallExpression(d.initializer) &&
        d.initializer.expression.getText() === "StyleSheet.create"
      ) {
        stylesStmt = st;
        stylesCall = d;
      }
    }
  }
  let usesCreateStyles = false;
  if (stylesCall) {
    const arg = stylesCall.initializer.arguments[0];
    const param = uses(arg, "colors") ? "colors" : "";
    edits.push({
      start: stylesCall.getStart(),
      end: stylesCall.getEnd(),
      text: `useStyles = createStyles((${param}) => (${arg.getText()}))`,
    });
    usesCreateStyles = true;
  }

  // ---- 3. components ----
  let usesUseTheme = false;
  const handled = new Set();
  if (stylesStmt) handled.add(stylesStmt);

  function handleFunction(name, fn, stmt) {
    if (!fn.body || !ts.isBlock(fn.body)) {
      if (uses(fn, "colors") || uses(fn, "styles")) {
        manual.push(
          `line ${lineOf(fn)}: ${name} has no { } body and uses colors/styles. Add the hooks by hand.`,
        );
      }
      return;
    }
    const needColors = uses(fn.body, "colors");
    const needStyles = uses(fn.body, "styles");
    // `colors` used in default values of parameters
    if (fn.parameters.some((p) => uses(p, "colors"))) {
      manual.push(
        `line ${lineOf(fn)}: ${name} uses colors in a parameter default. Move it inside the function.`,
      );
    }
    if (!needColors && !needStyles) return;
    if (
      (needColors && declares(fn, "colors")) ||
      (needStyles && declares(fn, "styles"))
    ) {
      manual.push(
        `line ${lineOf(fn)}: ${name} declares its own colors/styles. Check it by hand.`,
      );
      return;
    }
    if (!/^[A-Z]/.test(name) && name !== "default") {
      manual.push(
        `line ${lineOf(fn)}: ${name} is not a component but uses colors/styles. Pass colors in as a parameter.`,
      );
      return;
    }
    const lines = [];
    if (needColors) {
      lines.push("  const { colors } = useTheme();");
      usesUseTheme = true;
    }
    if (needStyles) lines.push("  const styles = useStyles();");
    edits.push({
      start: fn.body.getStart() + 1,
      end: fn.body.getStart() + 1,
      text: "\n" + lines.join("\n"),
    });
    handled.add(stmt);
  }

  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) || st === stylesStmt) continue;

    if (ts.isFunctionDeclaration(st)) {
      handleFunction(st.name ? st.name.text : "default", st, st);
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        const init = d.initializer;
        if (
          init &&
          (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) &&
          ts.isIdentifier(d.name)
        ) {
          handleFunction(d.name.text, init, st);
        } else if (uses(st, "colors")) {
          manual.push(
            `line ${lineOf(st)}: top-level constant uses colors (${st.getText().split("\n")[0].slice(0, 60)}...). ` +
              `Turn it into a function that takes colors, or build it inside the component.`,
          );
          handled.add(st);
        }
      }
    } else if (
      ts.isExportAssignment(st) ||
      ts.isExpressionStatement(st) ||
      ts.isClassDeclaration(st)
    ) {
      if (uses(st, "colors") || uses(st, "styles")) {
        manual.push(
          `line ${lineOf(st)}: uses colors/styles outside a function component. Check it by hand.`,
        );
      }
    }
  }

  // ---- 4. imports ----
  const kept = specs
    .filter((e) => e.name.text !== "colors")
    .map((e) => e.getText());
  const wanted = [];
  if (usesCreateStyles) wanted.push("createStyles");
  if (usesUseTheme) wanted.push("useTheme");
  let newImports = "";
  if (kept.length) {
    newImports += `import {\n${kept.map((k) => "  " + k + ",").join("\n")}\n} from "${themePath}";`;
  }
  if (wanted.length) {
    newImports +=
      (newImports ? "\n" : "") +
      `import { ${wanted.join(", ")} } from "${ctxPath}";`;
  }
  edits.push({
    start: themeImport.getStart(),
    end: themeImport.getEnd(),
    text: newImports,
  });

  // ---- apply ----
  edits.sort((a, b) => b.start - a.start);
  let out = original;
  for (const e of edits)
    out = out.slice(0, e.start) + e.text + out.slice(e.end);

  // StyleSheet is not used any more: drop it from the react-native import
  const body = out.replace(/import\s*\{[^}]*\}\s*from\s*"react-native";/, "");
  if (!/StyleSheet\./.test(body)) {
    out = out.replace(
      /(import\s*\{)([^}]*)(\}\s*from\s*"react-native";)/,
      (m, a, names, c) => {
        const list = names
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && s !== "StyleSheet");
        return list.length > 3
          ? `${a}\n${list.map((n) => "  " + n + ",").join("\n")}\n${c}`
          : `${a} ${list.join(", ")} ${c}`;
      },
    );
  }

  // anything else still reading the old constant?
  const sf2 = ts.createSourceFile(
    file,
    out,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const leftover = [];
  (function walk(n) {
    if (ts.isIdentifier(n) && n.text === "colors") {
      const p = n.parent;
      const isParam = ts.isParameter(p) && p.name === n;
      const isDecl =
        ts.isVariableDeclaration(p) ||
        ts.isObjectBindingPattern(p) ||
        ts.isBindingElement(p);
      const isProp =
        (ts.isPropertyAccessExpression(p) && p.name === n) ||
        (ts.isPropertyAssignment(p) && p.name === n);
      if (!isParam && !isDecl && !isProp && !ts.isImportSpecifier(p)) {
        // is there a binding for `colors` in an enclosing scope? check enclosing function text
        let scope = p;
        let bound = false;
        while (scope && !ts.isSourceFile(scope)) {
          if (
            (ts.isFunctionLike(scope) ||
              ts.isBlock(scope) ||
              ts.isArrowFunction(scope)) &&
            declares(scope, "colors")
          ) {
            bound = true;
            break;
          }
          scope = scope.parent;
        }
        if (!bound)
          leftover.push(
            sf2.getLineAndCharacterOfPosition(n.getStart()).line + 1,
          );
      }
    }
    ts.forEachChild(n, walk);
  })(sf2);
  if (leftover.length)
    manual.push(
      `colors is still used without the hook on line(s) ${[...new Set(leftover)].join(", ")} (output line numbers).`,
    );

  return { out, manual };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node convert-theme.js <file.tsx> [more files...]");
  process.exit(1);
}
let problems = 0;
for (const file of files) {
  const res = convert(file);
  const name = path.basename(file);
  if (res.skipped) {
    console.log(`- ${name}: skipped (${res.skipped})`);
    continue;
  }
  fs.writeFileSync(file, res.out);
  console.log(`+ ${name}: converted`);
  for (const m of res.manual) {
    problems += 1;
    console.log(`    MANUAL ${m}`);
  }
}
if (problems)
  console.log(
    `\n${problems} thing(s) need a manual change. Search for the line numbers above.`,
  );
