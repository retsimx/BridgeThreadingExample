using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Bridge;
using Bridge.Html5;
using Bridge.Linq;

namespace Threading
{
    public class Main
    {
        // The range of numbers to test for primes (0 - n)
        private const int MaxNumber = 10000000;

        // If the first 1000 primes from each run should be printed
        private const bool PrintFirst1000Primes = false;

        // The list of ints representing the number of threads to execute in each run
        private static readonly List<int> NumberOfThreadsPerTest = new List<int> {1, 2, 4, 6, 8, 12, 16};

        // Used to pass the range of ints to the RunPrime thread
        [ObjectLiteral]
        private class PrimeRange
        {
            // The first int in the range
            public int First;

            // The last int in the range
            public int Last;
        }

        // Checks if a single number is prime
        private static bool IsPrime(int number)
        {
            if (number == 1) return false;
            if (number == 2) return true;

            var boundary = (int) Math.Floor(Math.Sqrt(number));

            for (var i = 2; i <= boundary; ++i)
            {
                if (number % i == 0) return false;
            }

            return true;
        }

        // The entry point of each thread
        private static object RunPrime(object param)
        {
            // Convert the parameter to a range object
            var range = (PrimeRange) param;
            // Create an array to store the list of prime numbers found in the range
            var primes = new List<int>();
            // Iterate over the range and add any prime numbers to the primes array
            for (var n = range.First; n < range.Last; n++)
            {
                // Check if this number is prime
                if (IsPrime(n))
                    // Yes, add the number to the array
                    primes.Add(n);
            }

            // Return the prime numbers
            return primes.ToArray();
        }

        // Need to add a thread pool to Bridge perhaps
        // Simple utility function to join all threads in an array.
        private static void JoinAll(IEnumerable<Thread> threads, Action onJoined)
        {
            // Check if any threads are still alive
            if (threads.Any(e => e.IsAlive))
                // Yes, check again in a few milliseconds
                Window.SetTimeout(() => JoinAll(threads, onJoined), 10);
            else
                // No, all threads are finished, trigger the callback
                onJoined();
        }

        // Runs the next primes benchmark
        private static void BenchmarkPrimes()
        {
            // Get the number of threads for this benchmark
            var numberOfThreads = NumberOfThreadsPerTest[0];
            // Remove this number of threads from the available runs
            NumberOfThreadsPerTest.RemoveAt(0);

            Console.WriteLine("Starting next benchmark with " + numberOfThreads + " thread(s)...");

            // Get the start time
            var startTime = DateTime.Now;

            // Create an array to store the prime numbers
            var primeNumbers = new List<int>();
            // Calculate how many ints each thread will check
            var countPerThread = MaxNumber / numberOfThreads;
            // Create an array to store the created threads
            var threads = new List<Thread>();

            // Spawn the threads
            for (var i = 0; i < numberOfThreads; i++)
            {
                // Create the range for this thread
                var range = new PrimeRange
                {
                    First = i * countPerThread + 1,
                    Last = i * countPerThread + countPerThread + 1
                };

                // Create the new thread
                var t = new Thread(
                    // Specify the source files
                    new[]
                    {
                        // Include this javascript file (since bridge is loaded automatically)
                        Thread.GetCurrentJsFileUri()
                    }
                );

                // Start the thread
                t.Start(
                    // Set the entry point to RunPrime
                    RunPrime,
                    // range is the parameter sent to the entry point
                    range,
                    // Set the completion callback when the thread returns a value (thread, original parameter, result)
                    (thread, param, result) =>
                    {
                        // Cast the result object to an int array
                        var resultPrimes = (int[]) result;
                        // Add the primes to the list of primes
                        primeNumbers.AddRange(resultPrimes);
                    }
                );

                // Add the created thread to the list of spawned threads
                threads.Add(t);
            }

            // Wait for all threads to join
            JoinAll(threads, () =>
            {
                // Get the end time
                var endTime = DateTime.Now;

                // Clean up all created threads
                threads.ForEach(e => e.Dispose());

                // Get the number of prime numbers found
                var primeNumberCount = primeNumbers.Count;

                if (PrintFirst1000Primes)
                {
                    // Need to sort the primes array, since it is not in order
                    primeNumbers = primeNumbers.Slice(0, 1000);
                    primeNumbers.Sort();
                    // Print 100 rows of 10 primes
                    for (var i = 0; i < 100; i++)
                    {
                        var s = "";
                        for (var j = 0; j < 10; j++)
                            s += primeNumbers[i * 10 + j] + " ";

                        Console.WriteLine(s);
                    }
                }

                // Report the statistics from this run
                Console.WriteLine("Max number: " + MaxNumber + ", Threads: " + numberOfThreads + ", Time taken: " +
                                  (endTime - startTime).TotalMilliseconds + "ms, Number of primes: " +
                                  primeNumberCount);

                // Check if there are any more runs to do
                if (NumberOfThreadsPerTest.Count > 0)
                    // Yes, run the next benchmark
                    BenchmarkPrimes();
                else
                    // No, all done
                    Console.WriteLine("Complete.");
            });
        }

        private static void RunBenchmarkOnMainThread()
        {
            Console.WriteLine("Starting baseline benchmark on main thread...");

            // Get the start time
            var startTime = DateTime.Now;

            var primeNumbers = ((int[]) RunPrime(new PrimeRange
            {
                First = 1,
                Last = MaxNumber + 1
            })).ToList();

            // Get the end time
            var endTime = DateTime.Now;

            // Get the number of prime numbers found
            var primeNumberCount = primeNumbers.Count;

            if (PrintFirst1000Primes)
            {
                // Need to sort the primes array, since it is not in order
                primeNumbers = primeNumbers.Slice(0, 1000);
                primeNumbers.Sort();
                // Print 100 rows of 10 primes
                for (var i = 0; i < 100; i++)
                {
                    var s = "";
                    for (var j = 0; j < 10; j++)
                        s += primeNumbers[i * 10 + j] + " ";

                    Console.WriteLine(s);
                }
            }

            // Report the statistics from this run
            Console.WriteLine("Max number: " + MaxNumber + ", Threads: (Main Thread), Time taken: " +
                              (endTime - startTime).TotalMilliseconds + "ms, Number of primes: " + primeNumberCount);
        }

        [Ready]
        public static void Start()
        {
            Window.SetTimeout(() =>
                {
                    // Run the baseline benchmark
                    RunBenchmarkOnMainThread();

                    // Run the first benchmark
                    BenchmarkPrimes();
                },
                500);
        }
    }
}