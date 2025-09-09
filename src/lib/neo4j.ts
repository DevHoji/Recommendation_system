import neo4j, { Driver, Session } from 'neo4j-driver';

class Neo4jService {
  private driver: Driver | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    const uri = process.env.NEO4J_URI!;
    const username = process.env.NEO4J_USERNAME!;
    const password = process.env.NEO4J_PASSWORD!;

    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async getSession(): Promise<Session> {
    if (!this.driver) {
      this.connect();
    }
    return this.driver!.session({ database: process.env.NEO4J_DATABASE });
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const session = await this.getSession();
      const result = await session.run('RETURN 1 as test');
      await session.close();
      return result.records.length > 0;
    } catch (error) {
      console.error('Neo4j connection test failed:', error);
      return false;
    }
  }

  async runQuery(query: string, parameters: any = {}): Promise<any[]> {
    const session = await this.getSession();
    try {
      const result = await session.run(query, parameters);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  async runTransaction(queries: Array<{ query: string; parameters?: any }>): Promise<any[]> {
    const session = await this.getSession();
    const transaction = session.beginTransaction();
    
    try {
      const results = [];
      for (const { query, parameters = {} } of queries) {
        const result = await transaction.run(query, parameters);
        results.push(result.records.map(record => record.toObject()));
      }
      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }
}

export const neo4jService = new Neo4jService();
export default neo4jService;
