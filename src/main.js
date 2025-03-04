import * as core from '@actions/core'
const github = require('@actions/github')
/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run() {
  try {
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo ', { required: true })
    const pr_number = core.getInput('pr_number', { required: true })
    const token = core.getInput('token', { required: true })

    // ilk önce kullanıcıdan bu inputları alıyoruz
    const octokit = new github.getOctokit(token)

    //octokitle alakalı fonksiyonlar ne falan bakmak istiyorsan github octokite git diyo
    //octokitle alakalı herşeyi barındırıyomuş o documentasyon.

    //octokitin tam olarak ne işe yaradığını bilmiyorum

    const { data: changedFiles } = await octokit.rest.pull.listFiles({
      owner,
      repo,
      pull_number: pr_number
    })
    //-bu method json objesi döndürüyormuş 2 veya 3 keyi var httpresponse döndürüyor.
    //data diye bişe de döndürüyor bu payload apidan döndürülen

    let diffData = {
      addition: 0,
      deletions: 0,
      changes: 0
    }
    //bunlar commentin bodysi olacakmış

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions
      acc.deletions + file.deletions
      acc.changes += file.changes
      return acc
    }, diffData)

    //changed fileların üzerinde dönüp addition deletion ve changeleri topluyoz bunun için.

    //labelları ekleme olayı

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
                Pull request #${pr_number} has updated with: \n
                -${diffData.changes} changes \n
                -${diffData.addition} addition \n
                -${diffData.deletions} deletions \n
                
            `
    })
    //burda da commentleri oluşturuyoz

    for (const file of changedFiles) {
      //readme.md falan gibi geldiği için . ile splitlememmiz gerekiyor
      //pop yapınca mdyi verecek
      const fileExtension = file.filename.split('.').pop()
      let label = ''
      switch (fileExtension) {
        case 'md':
          label = 'markdown'
          break
        case 'js':
          label = 'javascript'
          break
        case 'yml':
          label = 'yaml'
          break
        case 'yaml':
          label = 'yaml'
          break
        default:
          label = 'noextension'
          break
      }
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: pr_number,
        labels: [label]
      })
    }
    //octokit librarysinde yine add labels kısmında varmış
  } catch (error) {
    core.setFailed(error.message)
  }
}
