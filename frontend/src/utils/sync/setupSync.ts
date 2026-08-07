import { OperationRegistry } from "./operationRegistry";
import { SyncHttpClient } from "./syncHttpClient";
import { SyncExecutor } from "./syncExecutor";
import { SaleExecutor } from "./executors/saleExecutor";
import { PaymentExecutor } from "./executors/paymentExecutor";
import { OpenBoxExecutor } from "./executors/openBoxExecutor";
import { CloseBoxExecutor } from "./executors/closeBoxExecutor";

const httpClient = new SyncHttpClient();
const registry = new OperationRegistry();

// Registrar os executores concretos para as operações de venda, pagamento e caixa
registry.register("sale", new SaleExecutor(httpClient));
registry.register("payment", new PaymentExecutor(httpClient));
registry.register("openBox", new OpenBoxExecutor(httpClient));
registry.register("closeBox", new CloseBoxExecutor(httpClient));

const syncExecutor = new SyncExecutor(registry, httpClient);

export { httpClient, registry, syncExecutor };
