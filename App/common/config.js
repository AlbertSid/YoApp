export default {
    header : {
        method: 'POST',
        headers: {
            'Cache-Control': 'no-cache',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    },
    api : {
        base: 'http://rapapi.org/mockjs/7260/',
        creation: 'api/creation',
        comment: 'api/comments',
        up: 'api/up',
        video: 'api/creations/video',
        audio: 'api/creations/audio',
        signup: 'api/u/signup',
        verify: 'api/u/verify',
        update: 'api/u/update',
        signature: 'api/signature'
    }
}
