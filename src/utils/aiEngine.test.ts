import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerInventoryQuestion,
  generateAiRecommendations,
  generateDailySummary,
} from './aiEngine';
import {
  createSeedProducts,
  createSeedPurchaseOrders,
  createSeedSuppliers,
  createSeedTransactions,
} from '../data/seedData';

test('generateAiRecommendations surfaces out-of-stock and low-stock SKUs first', () => {
  const products = createSeedProducts();
  const txs = createSeedTransactions();
  const suppliers = createSeedSuppliers();

  const recs = generateAiRecommendations(products, txs, suppliers);
  assert.equal(recs.length, products.length);
  const urgent = recs.filter((r) => r.suggestedReorderQty > 0);
  assert.ok(urgent.length >= 3);
  assert.ok(urgent[0].rationale.length > 10);
});

test('generateDailySummary returns sample-data marker and actions', () => {
  const products = createSeedProducts();
  const txs = createSeedTransactions();
  const suppliers = createSeedSuppliers();
  const pos = createSeedPurchaseOrders();

  const summary = generateDailySummary(products, txs, pos, suppliers);
  assert.equal(summary.isSampleData, true);
  assert.ok(summary.highlights.length === 3);
  assert.ok(summary.recommendedActions.length >= 1);
});

test('answerInventoryQuestion answers valuation, reorder, and velocity questions accurately', () => {
  const products = createSeedProducts();
  const txs = createSeedTransactions();
  const suppliers = createSeedSuppliers();
  const pos = createSeedPurchaseOrders();

  const worthReply = answerInventoryQuestion(
    'What is my inventory worth?',
    products,
    txs,
    suppliers,
    pos
  );
  assert.ok(worthReply.text.includes('$'));
  assert.equal(worthReply.proposedAction, undefined);

  const reorderReply = answerInventoryQuestion(
    'What needs reordering?',
    products,
    txs,
    suppliers,
    pos
  );
  assert.ok(reorderReply.text.includes('AI guidance only'));
  assert.ok(reorderReply.proposedAction);
  assert.equal(reorderReply.proposedAction?.kind, 'create_po');
  assert.equal(reorderReply.proposedAction?.confirmed, undefined);

  const fastReply = answerInventoryQuestion(
    'Which products are selling faster?',
    products,
    txs,
    suppliers,
    pos
  );
  assert.ok(fastReply.text.includes('units/day'));
});
