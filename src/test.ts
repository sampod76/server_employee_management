import { createDirectories } from './utils/createDir';

const TestFile = async () => {
  try {
    // const result = await stripeCheckPaymentIntentTransaction({
    //   pi_id: 'pi_3PUlORDtqwXq49Rq0jXHIpv3',
    // });
    // console.log('🚀 ~ TestFile ~ result:', result);
    // console.log('🚀 ~ TestFile ~ res:', res);

    // Define the base directory and the folders to be created
    // Function to start the Redis Docker container

    createDirectories();
    await asyncFunction();
  } catch (error) {
    console.log(error);
  }
};

const asyncFunction = async () => {
  try {
    // console.log('first');
    return 1;
  } catch (error) {
    console.log(error);
  }
};

export { TestFile };
