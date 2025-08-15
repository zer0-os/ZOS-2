/**
 * Application Services
 * 
 * Services coordinate between multiple layers and manage complex workflows.
 * They sit between the domain (kernel) and infrastructure (drivers/adapters).
 */

// Matrix integration orchestration
export { MatrixSessionBinder, type MatrixSession, matrixSessionBinder } from './matrix';
