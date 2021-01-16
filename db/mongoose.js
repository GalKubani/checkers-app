const mongoose = require('mongoose')

mongoose.connect(`mongodb+srv://galkubani:b8RQ7KkbeVmaE8lI@firstcluster.syjos.mongodb.net/checkers-api?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});