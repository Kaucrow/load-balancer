import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import util from 'util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const protoFilePath = path.join(__dirname, '../proto/matrix_determinant.proto');

const packageDefinition = protoLoader.loadSync(protoFilePath,{});
const matrix = grpc.loadPackageDefinition(packageDefinition).matrix;

const client = new matrix.MatrixDeterminantService('localhost:50051', grpc.credentials.createInsecure());

const calculateDeterminant = util.promisify(client.CalculateDeterminant).bind(client); 

export default calculateDeterminant;