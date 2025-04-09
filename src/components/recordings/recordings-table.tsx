import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useEffect, useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { recordingDB } from "@/lib/recording-db"
import { RecordingComposition, RecordingSession } from "@/types/recording"

export function RecordingsTable() {
  const [sessions, setSessions] = useState<RecordingSession[]>([])
  const [selectedSession, setSelectedSession] = useState<RecordingSession | null>(null)
  const [compositions, setCompositions] = useState<RecordingComposition[]>([])

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      loadCompositions(selectedSession.id)
    }
  }, [selectedSession])

  const loadSessions = async () => {
    const loadedSessions = await recordingDB.getAllSessions()
    setSessions(loadedSessions)
  }

  const loadCompositions = async (sessionId: string) => {
    const loadedCompositions = await recordingDB.getCompositionsBySession(sessionId)
    setCompositions(loadedCompositions)
  }

  return (
    <div className="space-y-4">
      {/* Таблица сессий */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Начало</TableHead>
              <TableHead>Окончание</TableHead>
              <TableHead>Композиций</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow
                key={session.id}
                className={selectedSession?.id === session.id ? "bg-muted" : ""}
                onClick={() => setSelectedSession(session)}
              >
                <TableCell>{session.metadata.name}</TableCell>
                <TableCell>
                  {format(session.startTime, "dd.MM.yyyy HH:mm:ss", { locale: ru })}
                </TableCell>
                <TableCell>
                  {format(session.endTime, "dd.MM.yyyy HH:mm:ss", { locale: ru })}
                </TableCell>
                <TableCell>{session.compositions.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Таблица композиций */}
      {selectedSession && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Дорожек</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compositions.map((composition) => (
                <TableRow key={composition.id}>
                  <TableCell>{format(composition.timestamp, "HH:mm:ss", { locale: ru })}</TableCell>
                  <TableCell>{composition.tracks.length}</TableCell>
                  <TableCell>
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        // TODO: Применить композицию
                      }}
                    >
                      Применить
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
