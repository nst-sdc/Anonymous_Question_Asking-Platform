import React, { useState } from 'react';

const Poll = () => {
  const [answer, setAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const options = ['Yes', 'No', 'Not sure'];

  const handleChange = (event) => {
    setAnswer(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (answer !== '') {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-5 shadow rounded mt-8">
      <h2 className="text-xl font-bold mb-4 text-center">Student Poll</h2>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit}>
          {options.map((option, index) => (
            <div key={index} className="mb-2">
              <label>
                <input
                  type="radio"
                  value={option}
                  checked={answer === option}
                  onChange={handleChange}
                  className="mr-2"
                />
                {option}
              </label>
            </div>
          ))}

          <button
            type="submit"
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      ) : (
        <p className="text-center text-green-600 font-medium">
          Thanks for voting! You chose: <strong>{answer}</strong>
        </p>
      )}
    </div>
  );
};

export default Poll;
