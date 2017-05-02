/**
 * @version 1.0.0.0
 * @copyright Copyright ©  2017
 * @compiler Bridge.NET 16.0.0-beta
 */
Bridge.assembly("Threading", function ($asm, globals) {
    "use strict";

    Bridge.define("Threading.Main", {
        statics: {
            fields: {
                MaxNumber: 0,
                PrintFirst1000Primes: false,
                NumberOfThreadsPerTest: null
            },
            ctors: {
                init: function () {
                    this.MaxNumber = 10000000;
                    this.PrintFirst1000Primes = false;
                    this.NumberOfThreadsPerTest = $asm.$.Threading.Main.f1(new (System.Collections.Generic.List$1(System.Int32))());
                    Bridge.ready(this.Start);
                }
            },
            methods: {
                IsPrime: function (number) {
                    if (number === 1) {
                        return false;
                    }
                    if (number === 2) {
                        return true;
                    }

                    var boundary = Bridge.Int.clip32(Math.floor(Math.sqrt(number)));

                    for (var i = 2; i <= boundary; i = (i + 1) | 0) {
                        if (number % i === 0) {
                            return false;
                        }
                    }

                    return true;
                },
                RunPrime: function (param) {
                    // Convert the parameter to a range object
                    var range = param;
                    // Create an array to store the list of prime numbers found in the range
                    var primes = new (System.Collections.Generic.List$1(System.Int32))();
                    // Iterate over the range and add any prime numbers to the primes array
                    for (var n = range.First; n < range.Last; n = (n + 1) | 0) {
                        // Check if this number is prime
                        if (Threading.Main.IsPrime(n)) {
                            primes.add(n);
                        }
                    }

                    // Return the prime numbers
                    return primes.toArray();
                },
                JoinAll: function (threads, onJoined) {
                    // Check if any threads are still alive
                    if (System.Linq.Enumerable.from(threads).any($asm.$.Threading.Main.f2)) {
                        window.setTimeout(function () {
                            Threading.Main.JoinAll(threads, onJoined);
                        }, 10);
                    } else {
                        onJoined();
                    }
                },
                BenchmarkPrimes: function () {
                    // Get the number of threads for this benchmark
                    var numberOfThreads = Threading.Main.NumberOfThreadsPerTest.getItem(0);
                    // Remove this number of threads from the available runs
                    Threading.Main.NumberOfThreadsPerTest.removeAt(0);

                    System.Console.WriteLine("Starting next benchmark with " + numberOfThreads + " thread(s)...");

                    // Get the start time
                    var startTime = new Date();

                    // Create an array to store the prime numbers
                    var primeNumbers = new (System.Collections.Generic.List$1(System.Int32))();
                    // Calculate how many ints each thread will check
                    var countPerThread = (Bridge.Int.div(Threading.Main.MaxNumber, numberOfThreads)) | 0;
                    // Create an array to store the created threads
                    var threads = new (System.Collections.Generic.List$1(System.Threading.Thread))();

                    // Spawn the threads
                    for (var i = 0; i < numberOfThreads; i = (i + 1) | 0) {
                        (function () {
                            // Create the range for this thread
                            var range = { First: ((((i * countPerThread) | 0) + 1) | 0), Last: ((((((i * countPerThread) | 0) + countPerThread) | 0) + 1) | 0) };

                            // Create the new thread
                            var t = new System.Threading.Thread.$ctor1(System.Array.init([System.Threading.Thread.getCurrentJsFileUri()], System.String));

                            // Start the thread
                            t.start('Threading.Main.RunPrime', range, function (thread, param, result) {
                                    // Cast the result object to an int array
                                    var resultPrimes = Bridge.as(result, System.Array.type(System.Int32));
                                    // Add the primes to the list of primes
                                    primeNumbers.addRange(resultPrimes);
                                });

                            // Add the created thread to the list of spawned threads
                            threads.add(t);
                        }).call(this);
                    }

                    // Wait for all threads to join
                    Threading.Main.JoinAll(threads, function () {
                        // Get the end time
                        var endTime = new Date();

                        // Clean up all created threads
                        threads.forEach($asm.$.Threading.Main.f3);

                        // Get the number of prime numbers found
                        var primeNumberCount = primeNumbers.Count;

                        if (Threading.Main.PrintFirst1000Primes) {
                            // Need to sort the primes array, since it is not in order
                            primeNumbers = primeNumbers.slice(0, 1000);
                            primeNumbers.sort();
                            // Print 100 rows of 10 primes
                            for (var i1 = 0; i1 < 100; i1 = (i1 + 1) | 0) {
                                var s = "";
                                for (var j = 0; j < 10; j = (j + 1) | 0) {
                                    s = System.String.concat(s, (primeNumbers.getItem(((((i1 * 10) | 0) + j) | 0)) + " "));
                                }

                                System.Console.WriteLine(s);
                            }
                        }

                        // Report the statistics from this run
                        System.Console.WriteLine("Max number: " + Threading.Main.MaxNumber + ", Threads: " + numberOfThreads + ", Time taken: " + System.Double.format((System.DateTime.subdd(endTime, startTime)).getTotalMilliseconds(), 'G') + "ms, Number of primes: " + primeNumberCount);

                        // Check if there are any more runs to do
                        if (Threading.Main.NumberOfThreadsPerTest.Count > 0) {
                            Threading.Main.BenchmarkPrimes();
                        } else {
                            // Run the baseline benchmark
                            Threading.Main.RunBenchmarkOnMainThread();

                            // All done
                            System.Console.WriteLine("Complete.");
                        }
                    });
                },
                RunBenchmarkOnMainThread: function () {
                    System.Console.WriteLine("Starting baseline benchmark on main thread...");

                    // Get the start time
                    var startTime = new Date();

                    var primeNumbers = System.Linq.Enumerable.from(Bridge.cast(Threading.Main.RunPrime({ First: 1, Last: 10000001 }), System.Array.type(System.Int32))).toList(System.Int32);

                    // Get the end time
                    var endTime = new Date();

                    // Get the number of prime numbers found
                    var primeNumberCount = primeNumbers.Count;

                    if (Threading.Main.PrintFirst1000Primes) {
                        // Need to sort the primes array, since it is not in order
                        primeNumbers = primeNumbers.slice(0, 1000);
                        primeNumbers.sort();
                        // Print 100 rows of 10 primes
                        for (var i = 0; i < 100; i = (i + 1) | 0) {
                            var s = "";
                            for (var j = 0; j < 10; j = (j + 1) | 0) {
                                s = System.String.concat(s, (primeNumbers.getItem(((((i * 10) | 0) + j) | 0)) + " "));
                            }

                            System.Console.WriteLine(s);
                        }
                    }

                    // Report the statistics from this run
                    System.Console.WriteLine("Max number: " + Threading.Main.MaxNumber + ", Threads: (Main Thread), Time taken: " + System.Double.format((System.DateTime.subdd(endTime, startTime)).getTotalMilliseconds(), 'G') + "ms, Number of primes: " + primeNumberCount);
                },
                Start: function () {
                    // Create a thread to demonstrate message passing
                    var t = new System.Threading.Thread.$ctor1(System.Array.init([System.Threading.Thread.getCurrentJsFileUri()], System.String));

                    // Set a message handler on the thread
                    t.addOnMessage($asm.$.Threading.Main.f4);

                    // Send a message to the worker
                    t.postMessage("hello from main thread:)");

                    window.setTimeout(Threading.Main.BenchmarkPrimes, 500);
                },
                MessagePassingThread: function () {
                    if (!System.Threading.Thread.CurrentThread.IsWebWorker) {
                        return;
                    }

                    // Set an on message handler for this web worker
                    System.Threading.Thread.CurrentThread.addOnMessage(function (o) {
                        // log the received message
                        console.log("Got message in worker: ", Bridge.unbox(o));
                        // Send a message back in reply
                        System.Threading.Thread.CurrentThread.postMessage("hello from the worker thread :)");
                    });
                }
            }
        },
        $entryPoint: true
    });

    Bridge.ns("Threading.Main", $asm.$);

    Bridge.apply($asm.$.Threading.Main, {
        f1: function (_o1) {
            _o1.add(1);
            _o1.add(2);
            _o1.add(4);
            _o1.add(6);
            _o1.add(8);
            _o1.add(12);
            _o1.add(16);
            return _o1;
        },
        f2: function (e) {
            return e.IsAlive;
        },
        f3: function (e) {
            e.dispose();
        },
        f4: function (o) {
            // Print the message received from the thread
            console.log("Got message in main thread: ", Bridge.unbox(o));
        }
    });

    Bridge.init(function () { Threading.Main.MessagePassingThread(); });
});
