import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import csv from 'csv-parser';
import { workerData } from 'node:worker_threads';
import { mongoUri } from '../config/env.js';
import Agent from '../models/Agent.js';
import User from '../models/User.js';
import UserAccount from '../models/UserAccount.js';
import PolicyCategory from '../models/PolicyCategory.js';
import PolicyCarrier from '../models/PolicyCarrier.js';
import Policy from '../models/Policy.js';
import ImportJob from '../models/ImportJob.js';

function normalizeKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getValue(row, names) {
  const normalized = new Map(Object.keys(row).map((key) => [normalizeKey(key), row[key]]));

  for (const name of names) {
    const value = normalized.get(normalizeKey(name));
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return null;
}

function parseDate(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const slashParts = trimmed.split('/');
    if (slashParts.length === 3) {
      const [m, d, y] = slashParts.map((p) => p.padStart(2, '0'));
      if (y.length === 4) return `${y}-${m}-${d}`;
    }
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  return null;
}

function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function parseXlsx(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(firstSheet, { defval: null });
}

async function findOrCreate(Model, filter, data) {
  return Model.findOneAndUpdate(
    filter,
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function processRow(row) {
  const agentName = getValue(row, ['Agent Name', 'AgentName', 'agent_name']);
  const firstName = getValue(row, ['First Name', 'FirstName', 'first_name']);
  const email = getValue(row, ['Email', 'email']);
  const policyNumber = getValue(row, ['Policy Number', 'PolicyNumber', 'policy_number']);
  const categoryName = getValue(row, [
    'Category Name',
    'CategoryName',
    'category_name',
    'Policy Category',
    'category',
    'LOB',
    'lob',
  ]);
  const companyName = getValue(row, [
    'Company Name',
    'CompanyName',
    'company_name',
    'Policy Carrier',
    'carrier',
    'Carrier',
    'Carrier Name',
  ]);

  if (!firstName || !policyNumber || !categoryName || !companyName) {
    throw new Error(
      `Missing required fields in row (firstName: "${firstName || ''}", policyNumber: "${policyNumber || ''}", category: "${categoryName || ''}", carrier: "${companyName || ''}")`
    );
  }

  let agent = null;

  if (agentName) {
    agent = await findOrCreate(
      Agent,
      { agentName: String(agentName).trim() },
      { agentName: String(agentName).trim() }
    );
  }

  const user = await findOrCreate(
    User,
    {
      email: email
        ? String(email).trim().toLowerCase()
        : `${String(firstName).trim().toLowerCase()}-unknown`,
    },
    {
      firstName: String(firstName).trim(),
      dob: parseDate(getValue(row, ['DOB', 'Date of Birth'])),
      address: getValue(row, ['Address']),
      phoneNumber: getValue(row, ['Phone Number', 'Phone', 'PhoneNumber']),
      state: getValue(row, ['State']),
      zipCode: getValue(row, ['Zip Code', 'ZipCode', 'ZIP Code']),
      email,
      gender: getValue(row, ['Gender']),
      userType: getValue(row, ['User Type', 'UserType', 'userType']),
      agentId: agent?._id,
    }
  );

  const accountName = getValue(row, ['Account Name', 'AccountName', 'account_name']);

  if (accountName) {
    await findOrCreate(
      UserAccount,
      { accountName: String(accountName).trim(), userId: user._id },
      { accountName: String(accountName).trim(), userId: user._id }
    );
  }

  const category = await findOrCreate(
    PolicyCategory,
    { categoryName: String(categoryName).trim() },
    { categoryName: String(categoryName).trim() }
  );

  const carrier = await findOrCreate(
    PolicyCarrier,
    { companyName: String(companyName).trim() },
    { companyName: String(companyName).trim() }
  );

  const policyResult = await Policy.updateOne(
    { policyNumber: String(policyNumber).trim() },
    {
      $set: {
        policyNumber: String(policyNumber).trim(),
        policyStartDate: parseDate(
          getValue(row, ['Policy Start Date', 'PolicyStartDate', 'policy_start_date'])
        ),
        policyEndDate: parseDate(
          getValue(row, ['Policy End Date', 'PolicyEndDate', 'policy_end_date'])
        ),
        policyCategoryId: category._id,
        carrierId: carrier._id,
        userId: user._id,
      },
    },
    { upsert: true }
  );

  return policyResult.upsertedCount > 0 ? 'added' : 'skipped';
}

async function main() {
  try {
    await mongoose.connect(mongoUri);
    await ImportJob.findByIdAndUpdate(workerData.jobId, { status: 'processing' });

    const fileName = path.basename(workerData.filePath);
    const extension = path.extname(workerData.filePath).toLowerCase();
    const rows =
      extension === '.csv' ? await parseCsv(workerData.filePath) : parseXlsx(workerData.filePath);

    console.log(`[Import Worker] Ingesting "${fileName}" (${rows.length} rows detected)...`);

    let processedRows = 0;
    let failedRows = 0;
    let addedRows = 0;
    let skippedRows = 0;

    for (const row of rows) {
      try {
        const outcome = await processRow(row);
        processedRows += 1;
        if (outcome === 'added') {
          addedRows += 1;
        } else {
          skippedRows += 1;
        }
      } catch (error) {
        failedRows += 1;
        console.warn(`[Import Worker] Skipped invalid row: ${error.message}`);
      }

      if ((processedRows + failedRows) % 100 === 0) {
        await ImportJob.findByIdAndUpdate(workerData.jobId, {
          processedRows,
          addedRows,
          skippedRows,
          failedRows,
        });
      }
    }

    await ImportJob.findByIdAndUpdate(workerData.jobId, {
      status: 'completed',
      totalRows: rows.length,
      processedRows,
      addedRows,
      skippedRows,
      failedRows,
    });

    console.log(
      `[Import Worker] Import complete: ${processedRows} processed (${addedRows} created, ${skippedRows} up-to-date, ${failedRows} failed).`
    );
  } finally {
    try {
      await mongoose.disconnect();
    } catch (error) {
      console.warn('[Import Worker] Database disconnect failed:', error.message);
    }

    if (fs.existsSync(workerData.filePath)) {
      try {
        fs.unlinkSync(workerData.filePath);
      } catch (err) {
        console.warn('[Import Worker] Could not delete temporary upload file:', err.message);
      }
    }
  }
}

main().catch(async (error) => {
  console.error('[Import Worker] Ingestion process failed:', error.message || error);

  try {
    await mongoose.connect(mongoUri);
    await ImportJob.findByIdAndUpdate(workerData.jobId, {
      status: 'failed',
      error: error.message,
    });
    await mongoose.disconnect();
  } catch (databaseError) {
    console.error(
      '[Import Worker] Failed to update job status in database:',
      databaseError.message || databaseError
    );
  }

  process.exit(1);
});
