import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

import { resources } from '../src/i18n/resources';

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
      const [stylesArg] = initializer.arguments;

      assert.ok(ts.isPropertyAccessExpression(initializer.expression));
      assert.ok(stylesArg && ts.isObjectLiteralExpression(stylesArg));
      return stylesArg;
    }
  }

  assert.fail('Could not find styles object');
}

function getStyleLiteral(sourceFile: ts.SourceFile, styleName: string) {
  const stylesObject = getStylesObject(sourceFile);

  for (const property of stylesObject.properties) {
    if (!ts.isPropertyAssignment(property) || getPropertyName(property.name) !== styleName) {
      continue;
    }

    assert.ok(ts.isObjectLiteralExpression(property.initializer));
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

test('ukrainian and russian resources keep visible UX copy fully localized', () => {
  const uk = resources.uk.translation;
  const ru = resources.ru.translation;

  assert.equal(uk.languageNames.en, 'Англійська');
  assert.equal(uk.content.difficulty.easy, 'Будівничий');
  assert.equal(uk.content.difficulty.medium, 'Дослідник');
  assert.equal(uk.content.difficulty.hard, 'Майстер Незеру');
  assert.equal(uk.results.badges.netherPerfect, 'Майстер Незеру без помилок');
  assert.equal(uk.rooms.hostBadge, '(ведучий)');
  assert.equal(
    uk.rooms.offlineCopy,
    'Навіть без живої синхронізації тут уже можна пройти весь сценарій кімнати й перевірити, як працює матч із друзями.'
  );
  assert.equal(uk.rooms.readDocs, 'Логіку вже описано в документації.');
  assert.equal(uk.rooms.items.codes, 'Коди кімнат і запрошення друзів без списку друзів.');
  assert.equal(
    uk.solo.loadError,
    'Не вдалося завантажити онлайн-питання, тому відкрито демонстраційний набір.'
  );

  assert.equal(ru.languageNames.en, 'Английский');
  assert.equal(ru.content.difficulty.easy, 'Строитель');
  assert.equal(ru.content.difficulty.medium, 'Исследователь');
  assert.equal(ru.content.difficulty.hard, 'Мастер Незера');
  assert.equal(ru.results.badges.netherPerfect, 'Мастер Незера без ошибок');
  assert.equal(ru.rooms.hostBadge, '(ведущий)');
  assert.equal(ru.rooms.readDocs, 'Логика уже описана в документации.');
  assert.equal(ru.rooms.items.codes, 'Коды комнат и приглашения друзей без списка друзей.');
  assert.equal(
    ru.solo.loadError,
    'Не удалось загрузить онлайн-вопросы, поэтому открыт демонстрационный набор.'
  );
});

test('web layout source allows long translated labels to wrap instead of overlapping', () => {
  const buttonSource = readFileSync(new URL('../src/components/ui/button.tsx', import.meta.url), 'utf8');
  const statPillSource = readFileSync(new URL('../src/components/ui/stat-pill.tsx', import.meta.url), 'utf8');
  const difficultySelectorSource = readFileSync(
    new URL('../src/features/home/difficulty-selector.tsx', import.meta.url),
    'utf8'
  );
  const onboardingModule = parseTsxModule('../src/features/onboarding/onboarding-view.tsx');
  const roomLobbySource = readFileSync(new URL('../src/features/rooms/room-lobby-view.tsx', import.meta.url), 'utf8');
  const resultsSource = readFileSync(new URL('../src/features/results/results-view.tsx', import.meta.url), 'utf8');

  assert.match(buttonSource, /numberOfLines=\{2\}/);
  assert.match(buttonSource, /flexShrink:\s*1/);
  assert.match(buttonSource, /textAlign:\s*'center'/);
  assert.match(statPillSource, /maxWidth:\s*'100%'/);
  assert.match(statPillSource, /flexShrink:\s*1/);
  assert.match(difficultySelectorSource, /flexWrap:\s*'wrap'/);
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'profilePlate', 'minWidth'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'previewRow', 'flexWrap'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'previewText', 'minWidth'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'optionBlock', 'minWidth'));
  assert.ok(styleHasProperty(onboardingModule.sourceFile, 'avatarCardActive', 'borderWidth'));
  assert.match(roomLobbySource, /participantMeta:\s*\{[\s\S]*minWidth:\s*0/);
  assert.match(resultsSource, /podiumStage:\s*\{[\s\S]*flexWrap:\s*'wrap'/);
});
