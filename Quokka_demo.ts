const person = {
	name: 'Chris',
	age: 32,
	location: 'BC'
};
console.log(person);

const nums = [1, 2, 3, 4, 5];
const sum = nums.reduce((acc, cur) => acc + cur);

sum;

const result = nums.reduce((acc, cur, index, arr) => {
	console.log(`Step ${index}: acc=${acc}, cur=${cur}, arr=${arr}`);
	return acc + cur;
}, 0);

console.log(result);

const ind = nums.reduce((acc, cur, index) => {
	console.log(`Step ${index}: Adding ${cur}`);
	return acc + cur;
}, 0);

const max = nums.reduce((acc, cur) => (cur > acc ? cur : acc));
console.log(max);

const min = nums.reduce((acc, cur) => (cur < acc ? cur : acc));
console.log(min);

const product = nums.reduce((acc, cur) => acc * cur, 1);
console.log(product);
