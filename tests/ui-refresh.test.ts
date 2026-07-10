import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

import { themeArt } from '../src/features/ui/theme-art';
import { appTheme, colors } from '../src/theme/tokens';

function parseTsxModule(path: string) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  return { sourceFile };
}

function getPropertyName(node: ts.PropertyName) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }

  return undefined;
}

function getFunctionBody(sourceFile: ts.SourceFile, functionName: string) {
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === functionName) {
      assert.ok(statement.body, `Expected ${functionName} to have a body`);
      return statement.body;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== functionName) {
        continue;
      }

      if (
        declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))
      ) {
        assert.ok(ts.isBlock(declaration.initializer.body), `Expected ${functionName} to use a block body`);
        return declaration.initializer.body;
      }
    }
  }

  assert.fail(`Could not find function ${functionName}`);
}

function getStylesObject(sourceFile: ts.SourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'styles') {
        continue;
      }

      assert.ok(declaration.initializer && ts.isCallExpression(declaration.initializer));
      const { initializer } = declaration;

      assert.ok(ts.isPropertyAccessExpression(initializer.expression));
      assert.equal(initializer.expression.expression.getText(sourceFile), 'StyleSheet');
      assert.equal(initializer.expression.name.text, 'create');

      const [stylesArg] = initializer.arguments;

      assert.ok(stylesArg && ts.isObjectLiteralExpression(stylesArg));
      return stylesArg;
    }
  }

  assert.fail('Could not find styles object');
}

function getStyleLiteral(sourceFile: ts.SourceFile, styleName: string) {
  const stylesObject = getStylesObject(sourceFile);

  for (const property of stylesObject.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    if (getPropertyName(property.name) !== styleName) {
      continue;
    }

    assert.ok(
      ts.isObjectLiteralExpression(property.initializer),
      `Expected styles.${styleName} to be an object literal`,
    );
    return property.initializer;
  }

  assert.fail(`Could not find styles.${styleName}`);
}

function styleHasProperty(sourceFile: ts.SourceFile, styleName: string, propertyName: string) {
  const styleLiteral = getStyleLiteral(sourceFile, styleName);

  return styleLiteral.properties.some(
    (property) => ts.isPropertyAssignment(property) && getPropertyName(property.name) === propertyName,
  );
}

function getStylePropertyText(sourceFile: ts.SourceFile, styleName: string, propertyName: string) {
  const styleLiteral = getStyleLiteral(sourceFile, styleName);

  for (const property of styleLiteral.properties) {
    if (!ts.isPropertyAssignment(property) || getPropertyName(property.name) !== propertyName) {
      continue;
    }

    return property.initializer.getText(sourceFile);
  }

  assert.fail(`Could not find styles.${styleName}.${propertyName}`);
}

function styleHasSpread(sourceFile: ts.SourceFile, styleName: string, expressionText: string) {
  const styleLiteral = getStyleLiteral(sourceFile, styleName);

  return styleLiteral.properties.some(
    (property) => ts.isSpreadAssignment(property) && property.expression.getText(sourceFile) === expressionText,
  );
}

function stylesObjectHasProperty(sourceFile: ts.SourceFile, styleName: string) {
  const stylesObject = getStylesObject(sourceFile);

  return stylesObject.properties.some(
    (property) => ts.isPropertyAssignment(property) && getPropertyName(property.name) === styleName,
  );
}

function nodeReferencesStyle(node: ts.Node, styleName: string, sourceFile: ts.SourceFile): boolean {
  let found = false;

  function visit(current: ts.Node) {
    if (found) {
      return;
    }

    if (
      ts.isPropertyAccessExpression(current) &&
      current.expression.getText(sourceFile) === 'styles' &&
      current.name.text === styleName
    ) {
      found = true;
      return;
    }

    ts.forEachChild(current, visit);
  }

  visit(node);
  return found;
}

function functionStylePropUses(sourceFile: ts.SourceFile, functionName: string, styleName: string) {
  const body = getFunctionBody(sourceFile, functionName);
  let found = false;

  function visit(node: ts.Node) {
    if (found) {
      return;
    }

    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'style' &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression &&
      nodeReferencesStyle(node.initializer.expression, styleName, sourceFile)
    ) {
      found = true;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(body);
  return found;
}

type JsxNode = ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment;

function isJsxNode(node: ts.Node): node is JsxNode {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}

function getJsxAttributes(node: JsxNode) {
  if (ts.isJsxFragment(node)) {
    return [];
  }

  if (ts.isJsxSelfClosingElement(node)) {
    return node.attributes.properties;
  }

  return node.openingElement.attributes.properties;
}

function jsxNodeUsesStyle(node: JsxNode, styleName: string, sourceFile: ts.SourceFile) {
  return getJsxAttributes(node).some(
    (property) =>
      ts.isJsxAttribute(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === 'style' &&
      property.initializer &&
      ts.isJsxExpression(property.initializer) &&
      property.initializer.expression &&
      nodeReferencesStyle(property.initializer.expression, styleName, sourceFile),
  );
}

function jsxNodeHasStringProp(node: JsxNode, propName: string, expectedValue: string) {
  return getJsxAttributes(node).some((property) => {
    if (
      !ts.isJsxAttribute(property) ||
      !ts.isIdentifier(property.name) ||
      property.name.text !== propName ||
      !property.initializer
    ) {
      return false;
    }

    return ts.isStringLiteral(property.initializer) && property.initializer.text === expectedValue;
  });
}

function jsxNodeContainsIdentifier(node: ts.Node, identifierName: string): boolean {
  let found = false;

  function visit(current: ts.Node) {
    if (found) {
      return;
    }

    if (ts.isIdentifier(current) && current.text === identifierName) {
      found = true;
      return;
    }

    ts.forEachChild(current, visit);
  }

  visit(node);
  return found;
}

function findJsxNodeUsingStyle(sourceFile: ts.SourceFile, functionName: string, styleName: string) {
  const body = getFunctionBody(sourceFile, functionName);
  let found: JsxNode | undefined;

  function visit(node: ts.Node) {
    if (found) {
      return;
    }

    if (isJsxNode(node) && jsxNodeUsesStyle(node, styleName, sourceFile)) {
      found = node;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(body);
  assert.ok(found, `Expected ${functionName} to render a JSX node using styles.${styleName}`);
  return found;
}

function getDirectJsxChildren(node: ts.Node) {
  if (!ts.isJsxElement(node) && !ts.isJsxFragment(node)) {
    return [];
  }

  return node.children.filter(isJsxNode);
}

test('terrain palette exposes layered block materials for every world variant', () => {
  assert.ok(colors.surfaceInset);
  assert.ok(colors.surfaceAccent);
  assert.ok(colors.borderFocus);
  assert.equal(appTheme.layout.cardRadius, 14);
  assert.ok(themeArt.overworld.terrainTop);
  assert.ok(themeArt.cave.terrainMid);
  assert.ok(themeArt.nether.terrainBottom);
  assert.ok(themeArt.overworld.detail);
});

test('visual foundation exposes expedition materials, surface tiers, and expanded world moods', () => {
  assert.ok('dirt' in appTheme.materials);
  assert.ok('grass' in appTheme.materials);
  assert.ok('stone' in appTheme.materials);
  assert.ok('ore' in appTheme.materials);
  assert.ok('torch' in appTheme.materials);

  assert.ok('hero' in appTheme.surfaceTiers);
  assert.ok('panel' in appTheme.surfaceTiers);
  assert.ok('utility' in appTheme.surfaceTiers);

  assert.ok(themeArt.camp);
  assert.ok(themeArt['stone-hall']);
  assert.ok(themeArt.reward);
  assert.ok(themeArt['classroom-hub']);
});

test('shared primitives wire block-relief style layers through their runtime style props', () => {
  const cardModule = parseTsxModule('../src/components/ui/card.tsx');
  const buttonModule = parseTsxModule('../src/components/ui/button.tsx');
  const statPillModule = parseTsxModule('../src/components/ui/stat-pill.tsx');
  const badgeModule = parseTsxModule('../src/features/ui/badge-chip.tsx');

  assert.ok(styleHasProperty(cardModule.sourceFile, 'innerStroke', 'boxShadow'));
  assert.ok(functionStylePropUses(cardModule.sourceFile, 'Card', 'innerStroke'));

  assert.ok(styleHasSpread(buttonModule.sourceFile, 'buttonFace', 'shadows.block'));
  assert.ok(styleHasProperty(buttonModule.sourceFile, 'buttonLip', 'paddingBottom'));
  assert.ok(functionStylePropUses(buttonModule.sourceFile, 'PrimaryButton', 'buttonFace'));
  assert.ok(functionStylePropUses(buttonModule.sourceFile, 'PrimaryButton', 'buttonLip'));
  assert.ok(functionStylePropUses(buttonModule.sourceFile, 'SecondaryButton', 'buttonFace'));
  assert.ok(functionStylePropUses(buttonModule.sourceFile, 'SecondaryButton', 'buttonLip'));

  assert.ok(styleHasProperty(statPillModule.sourceFile, 'inset', 'backgroundColor'));
  assert.ok(functionStylePropUses(statPillModule.sourceFile, 'StatPill', 'inset'));

  assert.ok(styleHasProperty(badgeModule.sourceFile, 'plate', 'borderWidth'));
  assert.ok(functionStylePropUses(badgeModule.sourceFile, 'BadgeChip', 'plate'));
});

test('shared primitives avoid deprecated web shadow props and pointerEvents attributes', () => {
  const cardSource = readFileSync(new URL('../src/components/ui/card.tsx', import.meta.url), 'utf8');
  const buttonSource = readFileSync(new URL('../src/components/ui/button.tsx', import.meta.url), 'utf8');
  const worldSource = readFileSync(new URL('../src/features/ui/world-background.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(cardSource, /shadowColor|shadowOffset|shadowOpacity|shadowRadius/);
  assert.doesNotMatch(buttonSource, /shadowColor|shadowOffset|shadowOpacity|shadowRadius/);
  assert.doesNotMatch(worldSource, /pointerEvents=\"none\"/);
  assert.match(worldSource, /pointerEvents:\s*'none'/);
});

test('world background uses layered terrain instead of horizon stripes', () => {
  const worldBackgroundModule = parseTsxModule('../src/features/ui/world-background.tsx');
  const contentShellNode = findJsxNodeUsingStyle(worldBackgroundModule.sourceFile, 'WorldBackground', 'contentShell');
  const source = readFileSync(new URL('../src/features/ui/world-background.tsx', import.meta.url), 'utf8');

  assert.ok(styleHasProperty(worldBackgroundModule.sourceFile, 'shell', 'borderRadius'));
  assert.ok(styleHasSpread(worldBackgroundModule.sourceFile, 'layers', 'StyleSheet.absoluteFillObject'));
  assert.ok(styleHasSpread(worldBackgroundModule.sourceFile, 'mist', 'StyleSheet.absoluteFillObject'));
  assert.ok(styleHasProperty(worldBackgroundModule.sourceFile, 'terrainTop', 'bottom'));
  assert.ok(styleHasProperty(worldBackgroundModule.sourceFile, 'terrainMid', 'bottom'));
  assert.ok(styleHasProperty(worldBackgroundModule.sourceFile, 'terrainBottom', 'bottom'));
  assert.ok(styleHasProperty(worldBackgroundModule.sourceFile, 'detail', 'bottom'));
  assert.ok(styleHasProperty(worldBackgroundModule.sourceFile, 'contentShell', 'zIndex'));
  assert.equal(getStylePropertyText(worldBackgroundModule.sourceFile, 'terrainTop', 'bottom'), "'12%'");
  assert.equal(getStylePropertyText(worldBackgroundModule.sourceFile, 'terrainTop', 'height'), "'10%'");
  assert.equal(getStylePropertyText(worldBackgroundModule.sourceFile, 'terrainMid', 'bottom'), "'5%'");
  assert.equal(getStylePropertyText(worldBackgroundModule.sourceFile, 'terrainMid', 'height'), "'8%'");
  assert.equal(getStylePropertyText(worldBackgroundModule.sourceFile, 'terrainBottom', 'height'), "'8%'");
  assert.equal(getStylePropertyText(worldBackgroundModule.sourceFile, 'detail', 'bottom'), '2');
  assert.equal(getStylePropertyText(worldBackgroundModule.sourceFile, 'detail', 'height'), '4');

  assert.ok(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'layers'));
  assert.ok(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'mist'));
  assert.ok(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'terrainTop'));
  assert.ok(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'terrainMid'));
  assert.ok(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'terrainBottom'));
  assert.ok(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'detail'));
  assert.ok(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'contentShell'));
  assert.match(source, /showTerrain\?: boolean/);
  assert.match(source, /showTerrain = true/);
  assert.match(source, /\{showTerrain \? \(/);
  assert.ok(!ts.isJsxSelfClosingElement(contentShellNode));
  assert.ok(jsxNodeContainsIdentifier(contentShellNode, 'children'));

  assert.equal(stylesObjectHasProperty(worldBackgroundModule.sourceFile, 'horizon'), false);
  assert.equal(stylesObjectHasProperty(worldBackgroundModule.sourceFile, 'stripe'), false);
  assert.equal(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'horizon'), false);
  assert.equal(functionStylePropUses(worldBackgroundModule.sourceFile, 'WorldBackground', 'stripe'), false);
});

test('home view splits the hero into header, control zone, and meta grid', () => {
  const homeViewModule = parseTsxModule('../src/features/home/home-view.tsx');

  assert.ok(styleHasProperty(homeViewModule.sourceFile, 'heroHeader', 'gap'));
  assert.ok(styleHasProperty(homeViewModule.sourceFile, 'heroControlZone', 'borderWidth'));
  assert.ok(styleHasProperty(homeViewModule.sourceFile, 'heroMetaGrid', 'flexWrap'));

  assert.ok(functionStylePropUses(homeViewModule.sourceFile, 'HomeView', 'heroHeader'));
  assert.ok(functionStylePropUses(homeViewModule.sourceFile, 'HomeView', 'heroControlZone'));
  assert.ok(functionStylePropUses(homeViewModule.sourceFile, 'HomeView', 'heroMetaGrid'));
});

test('home view promotes solo as the dominant expedition route and groups supporting paths separately', () => {
  const homeViewModule = parseTsxModule('../src/features/home/home-view.tsx');

  assert.ok(styleHasProperty(homeViewModule.sourceFile, 'routeBoard', 'gap'));
  assert.ok(styleHasProperty(homeViewModule.sourceFile, 'primaryRoute', 'padding'));
  assert.ok(styleHasProperty(homeViewModule.sourceFile, 'supportRoutes', 'gap'));
  assert.equal(styleHasProperty(homeViewModule.sourceFile, 'supportRoute', 'flexBasis'), false);
  assert.ok(styleHasProperty(homeViewModule.sourceFile, 'supportRoute', 'minWidth'));
  assert.ok(styleHasProperty(homeViewModule.sourceFile, 'expeditionLog', 'borderWidth'));

  assert.ok(functionStylePropUses(homeViewModule.sourceFile, 'HomeView', 'routeBoard'));
  assert.ok(functionStylePropUses(homeViewModule.sourceFile, 'HomeView', 'primaryRoute'));
  assert.ok(functionStylePropUses(homeViewModule.sourceFile, 'HomeView', 'supportRoutes'));
  assert.ok(functionStylePropUses(homeViewModule.sourceFile, 'HomeView', 'supportRoute'));
  assert.ok(functionStylePropUses(homeViewModule.sourceFile, 'HomeView', 'expeditionLog'));
});

test('home view keeps the solo CTA in the first expedition card', () => {
  const source = readFileSync(new URL('../src/features/home/home-view.tsx', import.meta.url), 'utf8');
  const heroIndex = source.indexOf('<Card highlight style={styles.heroCard}');
  const soloButtonIndex = source.indexOf('<PrimaryButton label={strings.primaryCardTitle} onPress={onPlaySolo} />');
  const routeBoardIndex = source.indexOf('<View style={styles.routeBoard}>');

  assert.ok(heroIndex >= 0);
  assert.ok(soloButtonIndex > heroIndex);
  assert.ok(routeBoardIndex > soloButtonIndex, 'Solo CTA should appear before lower route board content');
});

test('difficulty selector keeps chunkier wrap-friendly block controls', () => {
  const difficultySelectorModule = parseTsxModule('../src/features/home/difficulty-selector.tsx');

  assert.ok(styleHasProperty(difficultySelectorModule.sourceFile, 'button', 'flexBasis'));
  assert.ok(styleHasProperty(difficultySelectorModule.sourceFile, 'button', 'flexGrow'));
  assert.ok(styleHasProperty(difficultySelectorModule.sourceFile, 'button', 'flexShrink'));
  assert.ok(styleHasProperty(difficultySelectorModule.sourceFile, 'button', 'minHeight'));
  assert.ok(styleHasProperty(difficultySelectorModule.sourceFile, 'button', 'minWidth'));
  assert.ok(styleHasProperty(difficultySelectorModule.sourceFile, 'row', 'flexWrap'));
  assert.ok(functionStylePropUses(difficultySelectorModule.sourceFile, 'DifficultySelector', 'button'));
  assert.ok(functionStylePropUses(difficultySelectorModule.sourceFile, 'DifficultySelector', 'row'));
});

test('room lobby and results screens use wrapped slabs for controls and rewards', () => {
  const roomLobbyModule = parseTsxModule('../src/features/rooms/room-lobby-view.tsx');
  const resultsModule = parseTsxModule('../src/features/results/results-view.tsx');
  const roomHeroHeaderNode = findJsxNodeUsingStyle(roomLobbyModule.sourceFile, 'RoomLobbyView', 'heroHeader');
  const roomHeroControlZoneNode = findJsxNodeUsingStyle(
    roomLobbyModule.sourceFile,
    'RoomLobbyView',
    'heroControlZone',
  );
  const roomActionRailNode = findJsxNodeUsingStyle(roomLobbyModule.sourceFile, 'RoomLobbyView', 'commandActionRail');
  const resultsTrophyHeaderNode = findJsxNodeUsingStyle(resultsModule.sourceFile, 'ResultsView', 'trophyHeader');
  const resultsHeroSummaryNode = findJsxNodeUsingStyle(resultsModule.sourceFile, 'ResultsView', 'heroSummary');
  const resultsActionStackNode = findJsxNodeUsingStyle(resultsModule.sourceFile, 'ResultsView', 'actionStack');

  assert.ok(styleHasProperty(roomLobbyModule.sourceFile, 'heroHeader', 'gap'));
  assert.ok(styleHasProperty(roomLobbyModule.sourceFile, 'heroControlZone', 'borderWidth'));
  assert.ok(styleHasProperty(roomLobbyModule.sourceFile, 'commandActionRail', 'gap'));
  assert.ok(functionStylePropUses(roomLobbyModule.sourceFile, 'RoomLobbyView', 'heroHeader'));
  assert.ok(functionStylePropUses(roomLobbyModule.sourceFile, 'RoomLobbyView', 'heroControlZone'));
  assert.ok(functionStylePropUses(roomLobbyModule.sourceFile, 'RoomLobbyView', 'commandActionRail'));
  assert.equal(roomHeroHeaderNode.parent, roomHeroControlZoneNode.parent);
  assert.ok(ts.isJsxElement(roomHeroHeaderNode.parent) || ts.isJsxFragment(roomHeroHeaderNode.parent));
  assert.equal(getDirectJsxChildren(roomHeroHeaderNode.parent)[0], roomHeroHeaderNode);
  assert.equal(getDirectJsxChildren(roomHeroHeaderNode.parent)[1], roomHeroControlZoneNode);
  assert.ok(jsxNodeContainsIdentifier(roomActionRailNode, 'onToggleReady'));
  assert.ok(jsxNodeContainsIdentifier(roomActionRailNode, 'onStartBattle'));
  assert.ok(jsxNodeContainsIdentifier(roomActionRailNode, 'onLeaveRoom'));

  assert.ok(styleHasProperty(resultsModule.sourceFile, 'heroHeader', 'gap'));
  assert.ok(styleHasProperty(resultsModule.sourceFile, 'trophyHeader', 'gap'));
  assert.ok(styleHasProperty(resultsModule.sourceFile, 'heroSummary', 'borderWidth'));
  assert.ok(styleHasProperty(resultsModule.sourceFile, 'actionStack', 'gap'));
  assert.ok(functionStylePropUses(resultsModule.sourceFile, 'ResultsView', 'heroHeader'));
  assert.ok(functionStylePropUses(resultsModule.sourceFile, 'ResultsView', 'trophyHeader'));
  assert.ok(functionStylePropUses(resultsModule.sourceFile, 'ResultsView', 'heroSummary'));
  assert.ok(functionStylePropUses(resultsModule.sourceFile, 'ResultsView', 'actionStack'));
  assert.equal(resultsTrophyHeaderNode.parent, resultsHeroSummaryNode.parent);
  assert.ok(ts.isJsxElement(resultsTrophyHeaderNode.parent) || ts.isJsxFragment(resultsTrophyHeaderNode.parent));
  assert.equal(getDirectJsxChildren(resultsTrophyHeaderNode.parent)[0], resultsTrophyHeaderNode);
  assert.equal(getDirectJsxChildren(resultsTrophyHeaderNode.parent)[1], resultsHeroSummaryNode);
  assert.ok(jsxNodeContainsIdentifier(resultsActionStackNode, 'onPlayAgain'));
  assert.ok(jsxNodeContainsIdentifier(resultsActionStackNode, 'onBackHome'));
});

test('solo screen supports optional question illustrations without replacing the quiz flow', () => {
  const soloSource = readFileSync(new URL('../app/solo.tsx', import.meta.url), 'utf8');

  assert.match(soloSource, /Image/);
  assert.match(soloSource, /questionIllustrationSourceById/);
  assert.match(soloSource, /round\.question\.illustration/);
  assert.match(soloSource, /styles\.questionIllustrationFrame/);
  assert.match(soloSource, /styles\.questionIllustration/);
  assert.match(soloSource, /aspectRatio:\s*16\s*\/\s*7/);
  assert.match(soloSource, /maxHeight:\s*180/);
  assert.match(soloSource, /contentFit="cover"/);
  assert.match(soloSource, /styles\.factCard/);
  assert.match(soloSource, /t\('solo\.next'\)/);
});

test('solo screen renders answer options before the explanatory fact card', () => {
  const source = readFileSync(new URL('../app/solo.tsx', import.meta.url), 'utf8');
  const optionListIndex = source.indexOf('<View style={styles.optionList}>');
  const factCardIndex = source.indexOf('<Card style={styles.factCard}>');

  assert.ok(optionListIndex >= 0);
  assert.ok(factCardIndex > optionListIndex);
});

test('results stage the trophy summary, podium, and field notes as distinct reward surfaces', () => {
  const resultsModule = parseTsxModule('../src/features/results/results-view.tsx');

  assert.ok(styleHasProperty(resultsModule.sourceFile, 'trophyHeader', 'gap'));
  assert.ok(styleHasProperty(resultsModule.sourceFile, 'podiumStage', 'gap'));
  assert.ok(styleHasProperty(resultsModule.sourceFile, 'fieldNotes', 'borderWidth'));

  assert.ok(functionStylePropUses(resultsModule.sourceFile, 'ResultsView', 'trophyHeader'));
  assert.ok(functionStylePropUses(resultsModule.sourceFile, 'ResultsView', 'podiumStage'));
  assert.ok(functionStylePropUses(resultsModule.sourceFile, 'ResultsView', 'fieldNotes'));
});

test('results view disables terrain overlays in the dense summary hero', () => {
  const source = readFileSync(new URL('../src/features/results/results-view.tsx', import.meta.url), 'utf8');

  assert.match(source, /<WorldBackground[\s\S]*showTerrain=\{false\}/);
});

test('room and classroom lobbies use command surfaces and roster surfaces for team hub layouts', () => {
  const roomLobbyModule = parseTsxModule('../src/features/rooms/room-lobby-view.tsx');
  const classroomLobbyModule = parseTsxModule('../src/features/classroom/classroom-lobby-view.tsx');

  assert.ok(styleHasProperty(roomLobbyModule.sourceFile, 'commandSurface', 'borderWidth'));
  assert.ok(styleHasProperty(roomLobbyModule.sourceFile, 'rosterSurface', 'borderWidth'));
  assert.ok(styleHasProperty(roomLobbyModule.sourceFile, 'commandMetaGrid', 'flexWrap'));
  assert.ok(styleHasProperty(roomLobbyModule.sourceFile, 'commandActionRail', 'gap'));
  assert.ok(functionStylePropUses(roomLobbyModule.sourceFile, 'RoomLobbyView', 'commandSurface'));
  assert.ok(functionStylePropUses(roomLobbyModule.sourceFile, 'RoomLobbyView', 'rosterSurface'));
  assert.ok(functionStylePropUses(roomLobbyModule.sourceFile, 'RoomLobbyView', 'commandMetaGrid'));
  assert.ok(functionStylePropUses(roomLobbyModule.sourceFile, 'RoomLobbyView', 'commandActionRail'));

  assert.ok(styleHasProperty(classroomLobbyModule.sourceFile, 'classroomHub', 'borderWidth'));
  assert.ok(styleHasProperty(classroomLobbyModule.sourceFile, 'rosterSurface', 'borderWidth'));
  assert.ok(styleHasProperty(classroomLobbyModule.sourceFile, 'sessionBanner', 'borderWidth'));
  assert.ok(styleHasProperty(classroomLobbyModule.sourceFile, 'commandMetaGrid', 'flexWrap'));
  assert.ok(styleHasProperty(classroomLobbyModule.sourceFile, 'commandActionRail', 'gap'));
  assert.ok(functionStylePropUses(classroomLobbyModule.sourceFile, 'ClassroomLobbyView', 'classroomHub'));
  assert.ok(functionStylePropUses(classroomLobbyModule.sourceFile, 'ClassroomLobbyView', 'rosterSurface'));
  assert.ok(functionStylePropUses(classroomLobbyModule.sourceFile, 'ClassroomLobbyView', 'sessionBanner'));
  assert.ok(functionStylePropUses(classroomLobbyModule.sourceFile, 'ClassroomLobbyView', 'commandMetaGrid'));
  assert.ok(functionStylePropUses(classroomLobbyModule.sourceFile, 'ClassroomLobbyView', 'commandActionRail'));
});

test('onboarding turns the preview into a profile plate with blocky option controls', () => {
  const onboardingModule = parseTsxModule('../src/features/onboarding/onboarding-view.tsx');

  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'heroBlock', 'gap'));
  assert.ok(functionStylePropUses(onboardingModule.sourceFile, 'OnboardingView', 'heroBlock'));

  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'profilePlate', 'borderWidth'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'profilePlate', 'borderColor'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'profilePlate', 'padding'));
  assert.ok(functionStylePropUses(onboardingModule.sourceFile, 'OnboardingView', 'profilePlate'));

  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'previewRow', 'flexWrap'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'previewText', 'minWidth'));
  assert.ok(functionStylePropUses(onboardingModule.sourceFile, 'OnboardingView', 'previewText'));

  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'optionBlock', 'borderWidth'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'optionBlock', 'flexGrow'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'optionBlock', 'minWidth'));
  assert.ok(functionStylePropUses(onboardingModule.sourceFile, 'OnboardingView', 'optionBlock'));

  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'avatarCardActive', 'borderWidth'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'avatarCardActive', 'backgroundColor'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'avatarCardActive', 'borderColor'));
  assert.ok(functionStylePropUses(onboardingModule.sourceFile, 'OnboardingView', 'avatarCardActive'));
});

test('onboarding groups nickname, language, and avatar into clear adventurer setup steps', () => {
  const onboardingModule = parseTsxModule('../src/features/onboarding/onboarding-view.tsx');

  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'setupSteps', 'gap'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'stepCard', 'borderLeftWidth'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'stepCard', 'paddingTop'));

  assert.ok(functionStylePropUses(onboardingModule.sourceFile, 'OnboardingView', 'setupSteps'));
  assert.ok(functionStylePropUses(onboardingModule.sourceFile, 'OnboardingView', 'stepCard'));
});
