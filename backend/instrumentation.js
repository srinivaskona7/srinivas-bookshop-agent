// This module enables OpenTelemetry tracing for the backend. In Node.js
// preloading contexts (such as when using `node -r`), top‑level await
// cannot be used. Wrap all asynchronous imports and initialisation in an
// immediately invoked async function so that the module can be safely
// required or imported without raising ERR_REQUIRE_ASYNC_MODULE.

let sdk;
(async () => {
  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    });

    // When a Resource is not provided, the NodeSDK will automatically
    // construct one using environment variables such as OTEL_SERVICE_NAME,
    // OTEL_SERVICE_VERSION, and any other OTEL_RESOURCE_ATTRIBUTES. This
    // avoids direct dependencies on the @opentelemetry/resources package,
    // which may change its exports across versions.
    sdk = new NodeSDK({
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-grpc': {
          enabled: false, // Disable gRPC instrumentation if not needed
        },
      })],
    });

    // Start the SDK. Awaiting ensures any startup promises are handled before
    // continuing, but if the caller does not await this module, errors will
    // still be logged.
    await sdk.start();
    console.log('OpenTelemetry started successfully');
  } catch (error) {
    console.warn('OpenTelemetry failed to start:', error.message);
    console.warn('Continuing without tracing...');
  }
})();

process.on('SIGTERM', () => {
  if (sdk) {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry terminated'))
      .catch((error) => console.log('Error terminating OpenTelemetry', error))
      .finally(() => process.exit(0));
  } else {
    process.exit(0);
  }
});