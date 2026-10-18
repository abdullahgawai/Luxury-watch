import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {recoverySchema} from '../scripts/recovery-schema.mjs';

test('Recovery rejects missing indexes even when all restored rows are identical',()=>{
 const source=new DatabaseSync(':memory:'),restored=new DatabaseSync(':memory:');
 try{
  const sql='CREATE TABLE limits(key TEXT PRIMARY KEY,count INTEGER,expires_at INTEGER); CREATE INDEX limits_expiry_order ON limits(expires_at,key); INSERT INTO limits VALUES(\'fixture\',1,123);';
  source.exec(sql);restored.exec(sql);
  const expected=recoverySchema(source,['limits']);
  assert.deepEqual(recoverySchema(restored,['limits']),expected);
  restored.exec('DROP INDEX limits_expiry_order');
  assert.deepEqual(restored.prepare('SELECT * FROM limits').all(),source.prepare('SELECT * FROM limits').all());
  assert.notDeepEqual(recoverySchema(restored,['limits']),expected);
 }finally{source.close();restored.close();}
});

test('Recovery captures changed constraints and triggers and requires every selected table',()=>{
 const source=new DatabaseSync(':memory:'),restored=new DatabaseSync(':memory:');
 try{
  source.exec("CREATE TABLE records(id TEXT PRIMARY KEY,state TEXT DEFAULT 'draft' CHECK(state IN ('draft','review'))); CREATE TRIGGER protect_record BEFORE DELETE ON records BEGIN SELECT RAISE(ABORT,'protected'); END;");
  restored.exec("CREATE TABLE records(id TEXT PRIMARY KEY,state TEXT DEFAULT 'review');");
  const expected=recoverySchema(source,['records']);
  assert.ok(expected.some(row=>row.type==='trigger'));
  assert.notDeepEqual(recoverySchema(restored,['records']),expected);
  assert.throws(()=>recoverySchema(restored,['records','missing']),/Missing recovery table/);
  assert.throws(()=>recoverySchema(restored,['records','records']),/Unique/);
 }finally{source.close();restored.close();}
});
