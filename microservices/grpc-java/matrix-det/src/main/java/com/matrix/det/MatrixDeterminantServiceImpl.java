package com.matrix.det;

import com.matrix.det.grpc.DeterminantResponse;
import com.matrix.det.grpc.MatrixDeterminantServiceGrpc;
import com.matrix.det.grpc.MatrixRequest;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;

import java.util.Random;

public class MatrixDeterminantServiceImpl extends MatrixDeterminantServiceGrpc.MatrixDeterminantServiceImplBase {

    private final Random random = new Random();

    @Override
    public void calculateDeterminant(MatrixRequest request, StreamObserver<DeterminantResponse> responseObserver) {
        int rows = request.getRows();
        int cols = request.getCols();

        if (rows <= 0 || cols <= 0) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("Las dimensiones deben ser mayores a 0")
                    .asRuntimeException());
            return;
        }

        if (rows != cols) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("La matriz debe ser cuadrada para calcular el determinante. Se recibio: " + rows + "x" + cols)
                    .asRuntimeException());
            return;
        }

        double[][] matrix = generateRandomMatrix(rows);
        double determinant = calculateDet(matrix, rows);

        if (rows <= 20) {
            System.out.println("Matriz " + rows + "x" + cols + " generada:");
            printMatrix(matrix, rows);
        } else {
            System.out.println("Matriz " + rows + "x" + cols + " generada (no se imprime, supera 20x20)");
        }
        System.out.println("Determinante: " + determinant);

        DeterminantResponse response = DeterminantResponse.newBuilder()
                .setDeterminant(determinant)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    private double[][] generateRandomMatrix(int n) {
        double[][] matrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                matrix[i][j] = random.nextDouble(21) - 10;
            }
        }
        return matrix;
    }
    
// cofactores

    private double calculateDet(double[][] matrix, int n) {
        if (n == 1) {
            return matrix[0][0];
        }
        if (n == 2) {
            return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        }

        double det = 0.0;
        for (int col = 0; col < n; col++) {
            double[][] minor = getMinor(matrix, 0, col, n);
            double sign = (col % 2 == 0) ? 1.0 : -1.0;
            det += sign * matrix[0][col] * calculateDet(minor, n - 1);
        }
        return det;
    }

    private double[][] getMinor(double[][] matrix, int excludeRow, int excludeCol, int n) {
        double[][] minor = new double[n - 1][n - 1];
        int mi = 0;
        for (int i = 0; i < n; i++) {
            if (i == excludeRow) continue;
            int mj = 0;
            for (int j = 0; j < n; j++) {
                if (j == excludeCol) continue;
                minor[mi][mj] = matrix[i][j];
                mj++;
            }
            mi++;
        }
        return minor;
    }

    private void printMatrix(double[][] matrix, int n) {
        for (int i = 0; i < n; i++) {
            StringBuilder sb = new StringBuilder("  [");
            for (int j = 0; j < n; j++) {
                if (j > 0) sb.append(", ");
                sb.append(String.format("%6.1f", matrix[i][j]));
            }
            sb.append("]");
            System.out.println(sb);
        }
    }
}
