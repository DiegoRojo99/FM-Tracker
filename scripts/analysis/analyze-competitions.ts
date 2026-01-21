import { config } from 'dotenv';
import admin from 'firebase-admin';

config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const firestore = admin.firestore();

interface FieldAnalysis {
  type: string;
  count: number;
  samples: any[];
  nullable: number;
}

interface CollectionAnalysis {
  totalDocs: number;
  fields: Record<string, FieldAnalysis>;
  sampleDocs: any[];
}

function analyzeValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `array<${value.length > 0 ? analyzeValue(value[0]) : 'unknown'}>`;
  if (value instanceof admin.firestore.Timestamp) return 'timestamp';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

function analyzeField(docs: any[], fieldName: string): FieldAnalysis {
  const analysis: FieldAnalysis = {
    type: 'unknown',
    count: 0,
    samples: [],
    nullable: 0
  };

  const types = new Set<string>();
  const samples: any[] = [];

  for (const doc of docs) {
    if (fieldName in doc) {
      const value = doc[fieldName];
      const type = analyzeValue(value);
      types.add(type);
      analysis.count++;
      
      if (samples.length < 3 && value !== null && value !== undefined) {
        samples.push(value);
      }
    } else {
      analysis.nullable++;
    }
  }

  analysis.type = Array.from(types).join(' | ');
  analysis.samples = samples;
  return analysis;
}

async function analyzeCollection(collectionName: string): Promise<CollectionAnalysis> {
  console.log(`\n📊 Analyzing ${collectionName} collection...`);
  
  const snapshot = await firestore.collection(collectionName).get();
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${docs.length} documents`);
  
  // Get all unique field names across all documents
  const allFields = new Set<string>();
  docs.forEach(doc => {
    Object.keys(doc).forEach(field => allFields.add(field));
  });
  
  const fields: Record<string, FieldAnalysis> = {};
  
  for (const fieldName of allFields) {
    if (fieldName !== 'id') { // Skip the document ID
      fields[fieldName] = analyzeField(docs, fieldName);
    }
  }
  
  return {
    totalDocs: docs.length,
    fields,
    sampleDocs: docs.slice(0, 3) // First 3 documents for manual inspection
  };
}

async function main() {
  try {
    console.log('🔍 Competition Collections Analysis\n');
    
    // Analyze adminCompetitions collection
    const adminCompetitionsAnalysis = await analyzeCollection('adminCompetitions');
    
    console.log('\n📋 adminCompetitions Field Analysis:');
    console.log('=====================================');
    Object.entries(adminCompetitionsAnalysis.fields).forEach(([field, analysis]) => {
      console.log(`${field}:`);
      console.log(`  Type: ${analysis.type}`);
      console.log(`  Present in: ${analysis.count}/${adminCompetitionsAnalysis.totalDocs} docs`);
      console.log(`  Nullable: ${analysis.nullable} docs`);
      if (analysis.samples.length > 0) {
        console.log(`  Samples: ${JSON.stringify(analysis.samples.slice(0, 2))}`);
      }
      console.log('');
    });
    
    // Analyze apiCompetitions collection
    const apiCompetitionsAnalysis = await analyzeCollection('apiCompetitions');
    
    console.log('\n📋 apiCompetitions Field Analysis:');
    console.log('===================================');
    Object.entries(apiCompetitionsAnalysis.fields).forEach(([field, analysis]) => {
      console.log(`${field}:`);
      console.log(`  Type: ${analysis.type}`);
      console.log(`  Present in: ${analysis.count}/${apiCompetitionsAnalysis.totalDocs} docs`);
      console.log(`  Nullable: ${analysis.nullable} docs`);
      if (analysis.samples.length > 0) {
        console.log(`  Samples: ${JSON.stringify(analysis.samples.slice(0, 2))}`);
      }
      console.log('');
    });
    
    // Show sample documents for better understanding
    console.log('\n📝 Sample adminCompetitions Documents:');
    console.log('======================================');
    adminCompetitionsAnalysis.sampleDocs.forEach((doc, index) => {
      console.log(`Sample ${index + 1}:`, JSON.stringify(doc, null, 2));
      console.log('---');
    });
    
    console.log('\n📝 Sample apiCompetitions Documents:');
    console.log('====================================');
    apiCompetitionsAnalysis.sampleDocs.forEach((doc, index) => {
      console.log(`Sample ${index + 1}:`, JSON.stringify(doc, null, 2));
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error analyzing collections:', error);
  } finally {
    process.exit(0);
  }
}

main();