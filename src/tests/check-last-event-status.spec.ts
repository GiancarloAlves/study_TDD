import { set, reset } from 'mockdate'

class CheckLastEventStatus {
    constructor(private readonly loadLastEventRepository: LoadLastEventRepository) { }

    async perform({ groupId }: { groupId: string }): Promise<string> {
        const event = await this.loadLastEventRepository.loadLastEvent({ groupId })

        return event === undefined ? 'done' : 'active'
    }
}

interface LoadLastEventRepository {
    loadLastEvent: (input: { groupId: string }) => Promise<{ endDate: Date } | undefined>
}

class LoadLastEventRepositorySpy implements LoadLastEventRepository {
    groupId?: string
    callsCount = 0
    output?: { endDate: Date }

    async loadLastEvent({ groupId }: { groupId: string }): Promise<{ endDate: Date } | undefined> {
        this.groupId = groupId
        this.callsCount++

        return this.output
    }
}

type SutOutput = {
    sut: CheckLastEventStatus, loadLastEventRepository: LoadLastEventRepositorySpy
}

const makeSut = (): SutOutput => {
    const loadLastEventRepository = new LoadLastEventRepositorySpy()
    const sut = new CheckLastEventStatus(loadLastEventRepository)

    return { sut, loadLastEventRepository }
}

describe('CheckLastEventStatus', () => {
    const groupId = 'any_group_id'
    beforeAll(() => {
        set(new Date())
    })

    afterAll(() => {
        reset()
    })

    it('should get last event data', async () => {
        const { sut, loadLastEventRepository } = makeSut()

        await sut.perform({ groupId })

        expect(loadLastEventRepository.groupId).toBe(groupId)
        expect(loadLastEventRepository.callsCount).toBe(1)
    })

    it('should return status done when group has no event', async () => {
        const { sut, loadLastEventRepository } = makeSut()
        loadLastEventRepository.output = undefined

        const status = await sut.perform({ groupId })

        expect(status).toBe('done')
    })

    it('should return status active when now is before event end time', async () => {
        const { sut, loadLastEventRepository } = makeSut()
        loadLastEventRepository.output = {
            endDate: new Date(new Date().getTime() + 1)
        }

        const status = await sut.perform({ groupId })

        expect(status).toBe('active')
    })
})
