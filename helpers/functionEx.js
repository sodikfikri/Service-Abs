const functionEx = {
    ArrGroup: function(data, groupBy) {
        let arr1 = []
        // Return the end result
        let dataX = data.reduce((result, currentValue) => {
            // If an array already present for key, push it to the array. Else create an array and push the object
            (result[currentValue[groupBy]] = result[currentValue[groupBy]] || []).push(currentValue);
            // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
            return result;
        }, {}); // empty object is the initial value for result object
        // change array format
        for (let index in dataX) {
            arr1.push(dataX[index])
        }
        return arr1
    }

}

module.exports = functionEx